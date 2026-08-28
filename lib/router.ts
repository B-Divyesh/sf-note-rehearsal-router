import type { NoteRecord, RouteDefinition, RouteId, RouterState, TicketRecord } from './types';

export const FREE_NOTE_LIMIT = 30;
export const DEFAULT_TICKET_FOLDER = '.rehearsal';

export const ROUTE_DEFINITIONS: RouteDefinition[] = [
  { id: 'recall', label: 'Recall', key: '1', instruction: 'Retrieve it without looking' },
  { id: 'solve', label: 'Solve', key: '2', instruction: 'Use it on one concrete problem' },
  { id: 'teach', label: 'Teach', key: '3', instruction: 'Explain it in your own words' },
  { id: 'do', label: 'Do', key: '4', instruction: 'Take the smallest real step' },
  { id: 'archive', label: 'Archive', key: '5', instruction: 'Close the loop deliberately' }
];

export function initialState(): RouterState {
  return { version: 1, tickets: [], ticketFolder: DEFAULT_TICKET_FOLDER };
}

export function normalizeTitle(markdown: string, filename: string): string {
  const heading = markdown.match(/^\s*#\s+(.+?)\s*$/m)?.[1]
    ?.replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .trim();
  if (heading) return heading.slice(0, 120);
  return filename.replace(/\.md$/i, '').replace(/[-_]+/g, ' ').trim() || 'Untitled note';
}

export function plainExcerpt(markdown: string, maxLength = 520): string {
  const clean = markdown
    .replace(/^\s*---[\s\S]*?---\s*/, '')
    .replace(/```[\s\S]*?```/g, ' [code] ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*>\s?/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength).trimEnd()}…` : clean;
}

export function noteId(path: string): string {
  let hash = 2166136261;
  for (const character of path.normalize('NFC')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `note-${(hash >>> 0).toString(36)}`;
}

export function routePrompt(route: RouteId, title: string): string {
  const quoted = `“${title}”`;
  const prompts: Record<RouteId, string> = {
    recall: `Close the note. Write the central idea from ${quoted} from memory, then check what you missed.`,
    solve: `Use the idea in ${quoted} on one concrete example. Show each step and check the result.`,
    teach: `Explain ${quoted} out loud to an interested beginner, including one example and one limitation.`,
    do: `Choose the smallest real-world step suggested by ${quoted} and complete it before reopening the note.`,
    archive: `Write one sentence about why ${quoted} no longer deserves rehearsal, then let it leave the queue.`
  };
  return prompts[route];
}

export function safeFilename(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .toLowerCase() || 'untitled-note';
}

export function createTicket(note: NoteRecord, route: RouteId, createdAt = new Date()): TicketRecord {
  const iso = createdAt.toISOString();
  const stamp = iso.slice(0, 10);
  return {
    id: `ticket-${note.id}-${createdAt.getTime()}`,
    noteId: note.id,
    sourcePath: note.path,
    noteTitle: note.title,
    route,
    prompt: routePrompt(route, note.title),
    createdAt: iso,
    ticketPath: `${stamp}-${route}-${safeFilename(note.title)}.md`
  };
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

export function ticketMarkdown(ticket: TicketRecord): string {
  const routeName = ticket.route[0].toUpperCase() + ticket.route.slice(1);
  return `---
note-rehearsal-router: 1
type: ${ticket.route}
status: queued
source: ${yamlString(ticket.sourcePath)}
created: ${ticket.createdAt}
---

# ${routeName}: ${ticket.noteTitle}

## Source

\`${ticket.sourcePath.replace(/`/g, '\\`')}\`

## Rehearsal

${ticket.prompt}

## Completion

- [ ] Done
- Evidence or answer:

`;
}

export function untriagedNotes(notes: NoteRecord[], state: RouterState): NoteRecord[] {
  const routed = new Set(state.tickets.map((ticket) => ticket.noteId));
  return notes.filter((note) => !routed.has(note.id));
}

export function exportMarkdown(state: RouterState): string {
  const lines = ['# Note Rehearsal Router ledger', '', `Exported: ${new Date().toISOString()}`, ''];
  if (!state.tickets.length) lines.push('No notes routed yet.');
  for (const ticket of state.tickets) {
    lines.push(`## ${ticket.route.toUpperCase()} — ${ticket.noteTitle}`, '', `- Source: \`${ticket.sourcePath}\``, `- Created: ${ticket.createdAt}`, `- Ticket: \`${ticket.ticketPath}\``, '', ticket.prompt, '');
  }
  return lines.join('\n');
}
