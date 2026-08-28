export const ROUTES = ['recall', 'solve', 'teach', 'do', 'archive'] as const;
export type RouteId = (typeof ROUTES)[number];

export interface NoteRecord {
  id: string;
  path: string;
  name: string;
  title: string;
  excerpt: string;
  body: string;
  lastModified: number;
  size: number;
}

export interface TicketRecord {
  id: string;
  noteId: string;
  sourcePath: string;
  noteTitle: string;
  route: RouteId;
  prompt: string;
  createdAt: string;
  ticketPath: string;
}

export interface RouterState {
  version: 1;
  tickets: TicketRecord[];
  ticketFolder: string;
}

export interface RouteDefinition {
  id: RouteId;
  label: string;
  key: string;
  instruction: string;
}
