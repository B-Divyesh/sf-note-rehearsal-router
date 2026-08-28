import { normalizeTitle, noteId, plainExcerpt, safeFilename, ticketMarkdown } from './router';
import type { NoteRecord, TicketRecord } from './types';

type PermissionMode = 'read' | 'readwrite';
type PermissionCapableHandle = FileSystemDirectoryHandle & {
  queryPermission(descriptor?: { mode: PermissionMode }): Promise<PermissionState>;
  requestPermission(descriptor?: { mode: PermissionMode }): Promise<PermissionState>;
};

export async function chooseNotesDirectory(): Promise<FileSystemDirectoryHandle> {
  return window.showDirectoryPicker({ id: 'note-rehearsal-router-notes', mode: 'readwrite' });
}

export async function hasDirectoryPermission(handle: FileSystemDirectoryHandle, request = false): Promise<boolean> {
  const permissionHandle = handle as PermissionCapableHandle;
  const descriptor = { mode: 'readwrite' as const };
  if ((await permissionHandle.queryPermission(descriptor)) === 'granted') return true;
  return request && (await permissionHandle.requestPermission(descriptor)) === 'granted';
}

async function collectMarkdown(directory: FileSystemDirectoryHandle, prefix: string, ignoredFolder: string, output: NoteRecord[]): Promise<void> {
  for await (const [name, handle] of directory.entries()) {
    if (name === ignoredFolder || name === '.git' || name === 'node_modules') continue;
    const path = prefix ? `${prefix}/${name}` : name;
    if (handle.kind === 'directory') {
      await collectMarkdown(handle, path, ignoredFolder, output);
      continue;
    }
    if (!name.toLowerCase().endsWith('.md')) continue;
    const file = await handle.getFile();
    if (file.size > 2_000_000) continue;
    const body = await file.text();
    if (/^---[\s\S]{0,500}?note-rehearsal-router:\s*1\b/m.test(body)) continue;
    output.push({
      id: noteId(path),
      path,
      name,
      title: body ? normalizeTitle(body, name) : safeFilename(name.replace(/\.md$/i, '')),
      excerpt: plainExcerpt(body) || 'This note has no readable text yet.',
      body,
      lastModified: file.lastModified,
      size: file.size
    });
  }
}

export async function scanMarkdown(handle: FileSystemDirectoryHandle, ignoredFolder: string): Promise<NoteRecord[]> {
  const notes: NoteRecord[] = [];
  await collectMarkdown(handle, '', ignoredFolder, notes);
  return notes.sort((a, b) => b.lastModified - a.lastModified || a.path.localeCompare(b.path));
}

export async function writeTicket(root: FileSystemDirectoryHandle, folderName: string, ticket: TicketRecord): Promise<string> {
  const folder = await root.getDirectoryHandle(folderName, { create: true });
  let candidate = ticket.ticketPath;
  let counter = 2;
  while (true) {
    try {
      await folder.getFileHandle(candidate);
      candidate = ticket.ticketPath.replace(/\.md$/, `-${counter}.md`);
      counter += 1;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') break;
      throw error;
    }
  }
  const fileHandle = await folder.getFileHandle(candidate, { create: true });
  const writable = await fileHandle.createWritable();
  try {
    await writable.write(ticketMarkdown({ ...ticket, ticketPath: `${folderName}/${candidate}` }));
    await writable.close();
  } catch (error) {
    await writable.abort();
    throw error;
  }
  return `${folderName}/${candidate}`;
}

export async function removeTicket(root: FileSystemDirectoryHandle, ticketPath: string): Promise<void> {
  const parts = ticketPath.split('/');
  const filename = parts.pop();
  if (!filename) return;
  let directory = root;
  for (const part of parts) directory = await directory.getDirectoryHandle(part);
  await directory.removeEntry(filename);
}
