import './style.css';
import './demo/demo.css';
import { createSampleState, SAMPLE_NOTES } from '../lib/sample';
import { createTicket, exportMarkdown, ROUTE_DEFINITIONS, ticketMarkdown, untriagedNotes } from '../lib/router';
import type { RouteId, RouterState } from '../lib/types';

export const DEMO_STORAGE_KEY = 'demo:note-rehearsal-router:state';

function readState(): RouterState {
  try {
    const value = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) ?? 'null') as RouterState | null;
    if (value?.version === 1 && Array.isArray(value.tickets)) return value;
  } catch {
    // Reset malformed demo state below.
  }
  const seeded = createSampleState();
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

let state = readState();
let focusRoutesAfterRender = false;

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}

function saveState(): void {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
}

function announce(message: string): void {
  const status = document.querySelector<HTMLElement>('#demo-status');
  if (status) status.textContent = message;
}

function render(): void {
  const queue = untriagedNotes(SAMPLE_NOTES, state);
  const note = queue[0];
  const latest = state.tickets.at(-1)!;
  document.querySelector<HTMLElement>('#sample-count')!.textContent = `${state.tickets.length} routed · ${queue.length} waiting`;
  document.querySelector<HTMLElement>('#sample-note')!.innerHTML = note ? `
    <div class="note-meta"><span>${escapeHtml(note.path)}</span><span>${note.size} bytes</span></div>
    <article class="note-sheet"><p class="section-number">Current note</p><h2 id="note-title">${escapeHtml(note.title)}</h2><p>${escapeHtml(note.excerpt)}</p></article>` : `
    <article class="note-sheet note-sheet--complete"><p class="section-number">Sample complete</p><h2 id="note-title">Every sample note has an action</h2><p>Reset the demo to try another route.</p></article>`;
  const routeButtons = document.querySelector<HTMLElement>('#route-buttons')!;
  routeButtons.innerHTML = ROUTE_DEFINITIONS.map((route) => `<button type="button" class="demo-route demo-route--${route.id}" data-route="${route.id}" ${note ? '' : 'disabled'}><span aria-hidden="true">${route.key}</span><strong>${route.label}</strong><small>${route.instruction}</small></button>`).join('');
  document.querySelector<HTMLOListElement>('#sample-ledger')!.innerHTML = state.tickets.slice().reverse().map((ticket) => `<li><span class="ticket-type">${escapeHtml(ticket.route)}</span><strong>${escapeHtml(ticket.noteTitle)}</strong><small>${escapeHtml(ticket.ticketPath)}</small></li>`).join('');
  document.querySelector<HTMLElement>('#ticket-output')!.textContent = ticketMarkdown(latest);
  const undo = document.querySelector<HTMLButtonElement>('#undo-demo')!;
  undo.disabled = state.tickets.length <= 1;
  document.querySelectorAll<HTMLButtonElement>('[data-route]').forEach((button) => button.addEventListener('click', () => routeNote(button.dataset.route as RouteId)));
  if (focusRoutesAfterRender) {
    document.querySelector<HTMLButtonElement>('[data-route]:not([disabled])')?.focus();
    focusRoutesAfterRender = false;
  }
}

function routeNote(route: RouteId): void {
  const note = untriagedNotes(SAMPLE_NOTES, state)[0];
  if (!note) return;
  const ticket = createTicket(note, route);
  state = { ...state, tickets: [...state.tickets, { ...ticket, ticketPath: `.rehearsal/${ticket.ticketPath}` }] };
  saveState();
  focusRoutesAfterRender = true;
  render();
  announce(`${note.title} routed to ${route}. One sample ticket created.`);
}

function resetDemo(): void {
  localStorage.removeItem(DEMO_STORAGE_KEY);
  state = createSampleState();
  saveState();
  focusRoutesAfterRender = true;
  render();
  announce('Demo reset to four sample notes.');
}

function exportDemo(): void {
  const url = URL.createObjectURL(new Blob([exportMarkdown(state)], { type: 'text/markdown' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'note-rehearsal-demo-ledger.md';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
  announce('Sample ledger downloaded.');
}

document.querySelector<HTMLButtonElement>('#reset-demo')!.addEventListener('click', resetDemo);
document.querySelector<HTMLButtonElement>('#undo-demo')!.addEventListener('click', () => {
  if (state.tickets.length <= 1) return;
  const removed = state.tickets.at(-1)!;
  state = { ...state, tickets: state.tickets.slice(0, -1) };
  saveState();
  focusRoutesAfterRender = true;
  render();
  announce(`Route for ${removed.noteTitle} undone.`);
});
document.querySelector<HTMLButtonElement>('#export-demo')!.addEventListener('click', exportDemo);
document.querySelector<HTMLAnchorElement>('#start-real')!.addEventListener('click', () => localStorage.removeItem(DEMO_STORAGE_KEY));
document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement) return;
  const route = ROUTE_DEFINITIONS.find((item) => item.key === event.key);
  if (route) {
    event.preventDefault();
    routeNote(route.id);
  }
});

render();
