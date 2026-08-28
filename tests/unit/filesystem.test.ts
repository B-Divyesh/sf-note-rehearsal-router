import { describe, expect, it } from 'vitest';
import { scanMarkdown, writeTicket } from '../../lib/filesystem';
import { createTicket } from '../../lib/router';

class MockFileHandle {
  kind = 'file' as const;
  constructor(public name: string, private contents: string, private modified = 1) {}
  async getFile() {
    return {
      name: this.name,
      size: new TextEncoder().encode(this.contents).byteLength,
      lastModified: this.modified,
      text: async () => this.contents
    } as File;
  }
}

class MockDirectoryHandle {
  kind = 'directory' as const;
  entriesMap = new Map<string, MockDirectoryHandle | MockFileHandle>();
  written = new Map<string, string>();
  constructor(public name: string) {}
  async *entries() { yield* this.entriesMap.entries(); }
  async getDirectoryHandle(name: string, options?: { create?: boolean }) {
    const existing = this.entriesMap.get(name);
    if (existing instanceof MockDirectoryHandle) return existing;
    if (!options?.create) throw new DOMException('Missing', 'NotFoundError');
    const created = new MockDirectoryHandle(name);
    this.entriesMap.set(name, created);
    return created;
  }
  async getFileHandle(name: string, options?: { create?: boolean }) {
    const existing = this.entriesMap.get(name);
    if (existing instanceof MockFileHandle) return existing;
    if (!options?.create) throw new DOMException('Missing', 'NotFoundError');
    const directory = this;
    return {
      kind: 'file' as const,
      name,
      async createWritable() {
        let contents = '';
        return {
          async write(value: string) { contents = value; },
          async close() { directory.written.set(name, contents); directory.entriesMap.set(name, new MockFileHandle(name, contents)); },
          async abort() { contents = ''; }
        };
      }
    };
  }
}

describe('local filesystem workflow', () => {
  it('scans Markdown recursively while excluding generated tickets and non-Markdown files', async () => {
    const root = new MockDirectoryHandle('notes');
    root.entriesMap.set('idea.md', new MockFileHandle('idea.md', '# Useful idea\nPractice this.', 4));
    root.entriesMap.set('image.png', new MockFileHandle('image.png', 'not markdown'));
    const nested = new MockDirectoryHandle('nested');
    nested.entriesMap.set('second.md', new MockFileHandle('second.md', '# Second', 5));
    root.entriesMap.set('nested', nested);
    const tickets = new MockDirectoryHandle('.rehearsal');
    tickets.entriesMap.set('ticket.md', new MockFileHandle('ticket.md', '---\nnote-rehearsal-router: 1\n---'));
    root.entriesMap.set('.rehearsal', tickets);

    const notes = await scanMarkdown(root as unknown as FileSystemDirectoryHandle, '.rehearsal');
    expect(notes.map((item) => item.path)).toEqual(['nested/second.md', 'idea.md']);
  });

  it('writes one separate ticket and leaves the source entry in place', async () => {
    const root = new MockDirectoryHandle('notes');
    root.entriesMap.set('idea.md', new MockFileHandle('idea.md', '# Useful idea'));
    const [note] = await scanMarkdown(root as unknown as FileSystemDirectoryHandle, '.rehearsal');
    const path = await writeTicket(root as unknown as FileSystemDirectoryHandle, '.rehearsal', createTicket(note, 'recall', new Date('2026-08-28T00:00:00Z')));
    const folder = root.entriesMap.get('.rehearsal') as MockDirectoryHandle;
    expect(path).toMatch(/^\.rehearsal\/2026-08-28-recall-useful-idea\.md$/);
    expect(folder.written.size).toBe(1);
    expect(folder.written.values().next().value).toContain('type: recall');
    expect(root.entriesMap.get('idea.md')).toBeInstanceOf(MockFileHandle);
  });
});
