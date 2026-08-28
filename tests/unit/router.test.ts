import { describe, expect, it } from 'vitest';
import { createTicket, exportMarkdown, initialState, normalizeTitle, noteId, plainExcerpt, routePrompt, safeFilename, ticketMarkdown, untriagedNotes } from '../../lib/router';
import type { NoteRecord } from '../../lib/types';

const note: NoteRecord = {
  id: noteId('learning/spaced repetition.md'),
  path: 'learning/spaced repetition.md',
  name: 'spaced repetition.md',
  title: 'Why spacing works',
  excerpt: 'A short note.',
  body: '# Why spacing works\nA short note.',
  lastModified: 1,
  size: 42
};

describe('router domain', () => {
  it('extracts a clean heading and readable excerpt without mutating markdown', () => {
    const source = '---\ntags: [learning]\n---\n# **Retrieval** [practice](https://example.com)\n\n> Pull ideas out.\n\n- Often';
    expect(normalizeTitle(source, 'fallback.md')).toBe('Retrieval practice');
    expect(plainExcerpt(source)).toContain('Retrieval practice Pull ideas out. • Often');
    expect(source).toContain('tags: [learning]');
  });

  it('creates stable path IDs and safe ticket names', () => {
    expect(noteId('A/Note.md')).not.toBe(noteId('a/note.md'));
    expect(noteId('a/other.md')).not.toBe(note.id);
    expect(safeFilename(' What: / next? ')).toBe('what-next');
  });

  it.each(['recall', 'solve', 'teach', 'do', 'archive'] as const)('creates exactly one %s ticket with actionable Markdown', (route) => {
    const ticket = createTicket(note, route, new Date('2026-08-28T12:00:00Z'));
    const markdown = ticketMarkdown(ticket);
    expect(ticket.route).toBe(route);
    expect(ticket.prompt).toBe(routePrompt(route, note.title));
    expect(markdown).toContain(`type: ${route}`);
    expect(markdown).toContain('status: queued');
    expect(markdown).toContain('- [ ] Done');
    expect(markdown).toContain('learning/spaced repetition.md');
  });

  it('removes routed notes from the queue and keeps exports available', () => {
    const ticket = createTicket(note, 'teach', new Date('2026-08-28T12:00:00Z'));
    const state = { ...initialState(), tickets: [ticket] };
    expect(untriagedNotes([note], state)).toHaveLength(0);
    expect(exportMarkdown(state)).toContain('TEACH — Why spacing works');
  });
});
