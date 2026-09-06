import { createTicket, noteId } from './router';
import type { NoteRecord, RouterState } from './types';

export const SAMPLE_NOTES: NoteRecord[] = [
  {
    id: noteId('learning/retrieval-practice.md'),
    path: 'learning/retrieval-practice.md',
    name: 'retrieval-practice.md',
    title: 'Why retrieval practice beats rereading',
    excerpt: 'Retrieval strengthens access to a memory. Rereading can feel fluent even when the idea is hard to recall later.',
    body: '# Why retrieval practice beats rereading\n\nRetrieval strengthens access to a memory. Rereading can feel fluent even when the idea is hard to recall later.',
    lastModified: 4,
    size: 182
  },
  {
    id: noteId('statistics/estimate-first.md'),
    path: 'statistics/estimate-first.md',
    name: 'estimate-first.md',
    title: 'Estimate before calculating',
    excerpt: 'An order-of-magnitude estimate catches unit mistakes before exact arithmetic makes the answer look trustworthy.',
    body: '# Estimate before calculating\n\nAn order-of-magnitude estimate catches unit mistakes before exact arithmetic makes the answer look trustworthy.',
    lastModified: 3,
    size: 164
  },
  {
    id: noteId('software/cache-invalidation.md'),
    path: 'software/cache-invalidation.md',
    name: 'cache-invalidation.md',
    title: 'Cache invalidation has two clocks',
    excerpt: 'A cache entry has the age your system records and the age users can observe. Those clocks can disagree during partial failures.',
    body: '# Cache invalidation has two clocks\n\nA cache entry has the age your system records and the age users can observe. Those clocks can disagree during partial failures.',
    lastModified: 2,
    size: 194
  },
  {
    id: noteId('practical/book-first-aid-refresher.md'),
    path: 'practical/book-first-aid-refresher.md',
    name: 'book-first-aid-refresher.md',
    title: 'Book a first-aid refresher',
    excerpt: 'Reading the checklist is not practice. Find the next local class and add one suitable date to the calendar.',
    body: '# Book a first-aid refresher\n\nReading the checklist is not practice. Find the next local class and add one suitable date to the calendar.',
    lastModified: 1,
    size: 157
  }
];

export function createSampleState(): RouterState {
  const firstTicket = createTicket(SAMPLE_NOTES[0], 'recall', new Date('2026-09-01T09:00:00.000Z'));
  return {
    version: 1,
    ticketFolder: '.rehearsal',
    tickets: [{ ...firstTicket, ticketPath: `.rehearsal/${firstTicket.ticketPath}` }]
  };
}
