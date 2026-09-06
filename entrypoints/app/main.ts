import './style.css';
import { chooseNotesDirectory, hasDirectoryPermission, removeTicket, scanMarkdown, writeTicket } from '../../lib/filesystem';
import { CHECKOUT_URL, captureLicenseFromUrl, clearLicense, restoreLicense, verifyLicense } from '../../lib/license';
import { availableNotes, createTicket, DEFAULT_TICKET_FOLDER, exportMarkdown, ROUTE_DEFINITIONS, untriagedNotes } from '../../lib/router';
import { clearLocalData, loadDirectoryHandle, loadState, saveDirectoryHandle, saveState } from '../../lib/storage';
import type { NoteRecord, RouteId, RouterState } from '../../lib/types';

type View = 'loading' | 'onboarding' | 'permission' | 'ready' | 'empty' | 'error';

const app = document.querySelector<HTMLDivElement>('#app')!;
let state: RouterState = { version: 1, tickets: [], ticketFolder: DEFAULT_TICKET_FOLDER };
let directory: FileSystemDirectoryHandle | undefined;
let notes: NoteRecord[] = [];
let view: View = 'loading';
let errorMessage = '';
let folderName = '';
let routing = false;
let unlocked = false;
let licenseNotice = '';
let announcement = '';
let initialized = false;

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}

function currentQueue(): NoteRecord[] {
  return availableNotes(notes, state, unlocked);
}

function routeButtons(): string {
  return ROUTE_DEFINITIONS.map((route) => `
    <button class="route route--${route.id}" type="button" data-route="${route.id}" ${routing ? 'disabled' : ''}>
      <span class="route__key" aria-hidden="true">${route.key}</span>
      <span><strong>${route.label}</strong><small>${route.instruction}</small></span>
    </button>`).join('');
}

function notePanel(note: NoteRecord): string {
  return `
    <section class="workbench" aria-labelledby="note-title">
      <div class="note-meta"><span>${escapeHtml(note.path)}</span><span>${Math.max(1, Math.round(note.size / 1024))} KB</span></div>
      <article class="note-sheet">
        <p class="eyebrow">Current note</p>
        <h2 id="note-title">${escapeHtml(note.title)}</h2>
        <p class="note-excerpt">${escapeHtml(note.excerpt)}</p>
      </article>
      <div class="junction" aria-hidden="true"><span></span></div>
      <fieldset class="routes" ${routing ? 'disabled' : ''}>
        <legend>Choose exactly one next action</legend>
        ${routeButtons()}
      </fieldset>
    </section>`;
}

function mainContent(): string {
  if (view === 'loading') return `<section class="state"><div class="loader" aria-hidden="true"></div><h2>Opening your local queue…</h2><p>No note content leaves this browser.</p></section>`;
  if (view === 'onboarding') return `
    <section class="state state--onboarding">
      <div class="route-sketch" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <p class="eyebrow">Your notes stay here</p>
      <h2>Choose a Markdown folder</h2>
      <p>We’ll read <code>.md</code> files and write new action tickets into <code>.rehearsal/</code>. Source notes are never changed.</p>
      <button class="button button--primary" type="button" data-action="choose-folder">Choose notes folder</button>
      <a class="button button--quiet" href="https://note-rehearsal-router.sociobot.in/demo/" target="_blank" rel="noreferrer">Try it with sample data</a>
      <p class="microcopy">Chrome will ask for read and write access. The extension has no permission to read websites.</p>
    </section>`;
  if (view === 'permission') return `
    <section class="state">
      <p class="eyebrow">Permission paused</p>
      <h2>Reconnect ${escapeHtml(folderName || 'your notes folder')}</h2>
      <p>The browser pauses folder access after a restart. Reconnect to rescan and write tickets; nothing was uploaded or lost.</p>
      <button class="button button--primary" type="button" data-action="request-permission">Reconnect folder</button>
      <button class="button button--quiet" type="button" data-action="choose-folder">Choose a different folder</button>
    </section>`;
  if (view === 'error') return `
    <section class="state state--error" role="alert">
        <p class="eyebrow">Ticket not created</p>
        <h2>The local queue could not update</h2>
      <p>${escapeHtml(errorMessage)}</p>
      <button class="button button--primary" type="button" data-action="retry">Try again</button>
      <button class="button button--quiet" type="button" data-action="choose-folder">Choose another folder</button>
    </section>`;
  const queue = currentQueue();
  if (view === 'empty' || !queue.length) {
    const limited = !unlocked && untriagedNotes(notes, state).length > 0;
    if (limited) return `
      <section class="state">
        <p class="eyebrow">Free queue complete</p>
        <h2>You routed 30 notes</h2>
        <p>Your tickets and ledger are yours. Unlock unlimited routing for the rest of this folder, or export what you’ve done now.</p>
        <a class="button button--primary" href="${CHECKOUT_URL}" target="_blank" rel="noreferrer">Unlock for $19 once</a>
        <button class="button button--quiet" type="button" data-action="export">Export ledger</button>
      </section>`;
    if (!notes.length) return `
      <section class="state state--complete">
        <div class="complete-mark" aria-hidden="true">0</div>
        <p class="eyebrow">Folder connected</p>
        <h2>No Markdown notes found</h2>
        <p>Add a <code>.md</code> file anywhere in ${escapeHtml(folderName || 'this folder')}, then rescan—or choose a different folder.</p>
        <button class="button button--primary" type="button" data-action="rescan">Scan again</button>
        <button class="button button--quiet" type="button" data-action="choose-folder">Choose another folder</button>
      </section>`;
    return `
      <section class="state state--complete">
        <div class="complete-mark" aria-hidden="true">✓</div>
        <p class="eyebrow">Queue clear</p>
        <h2>Every found note has a direction</h2>
        <p>New or unrouted Markdown files will appear on the next scan. Your source notes are untouched.</p>
        <button class="button button--primary" type="button" data-action="rescan">Scan for new notes</button>
      </section>`;
  }
  return notePanel(queue[0]);
}

function render(): void {
  const queue = currentQueue();
  const totalUntriaged = untriagedNotes(notes, state).length;
  const routedCount = state.tickets.length;
  const progressMax = Math.max(1, routedCount + queue.length);
  const progress = Math.round((routedCount / progressMax) * 100);
  const lastTicket = state.tickets.at(-1);
  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#main" aria-label="Note Rehearsal Router home"><img src="/icon/route-mark.svg" alt="" width="32" height="32"><span>Note Rehearsal<br><strong>Router</strong></span></a>
      <nav aria-label="Desk actions">
        <button class="icon-button" type="button" data-action="rescan" title="Rescan folder (R)" ${!directory ? 'disabled' : ''}><span aria-hidden="true">↻</span><span>Rescan</span></button>
        <button class="icon-button" type="button" data-action="export" title="Export ledger (E)"><span aria-hidden="true">↓</span><span>Export</span></button>
        <button class="icon-button" type="button" data-action="toggle-settings" aria-expanded="false" aria-controls="settings"><span aria-hidden="true">⌁</span><span>Settings</span></button>
      </nav>
    </header>
    <main id="main" tabindex="-1">
      <div class="intro">
        <div><p class="kicker">One note. One direction.</p><h1>Route one note.</h1></div>
        <div class="queue-meter" aria-label="${routedCount} routed, ${totalUntriaged} waiting"><span><strong>${routedCount}</strong> routed</span><span><strong>${totalUntriaged}</strong> waiting</span><div><i style="width:${progress}%"></i></div></div>
      </div>
      <div class="desk-grid">
        ${mainContent()}
        <aside class="ledger" aria-labelledby="ledger-title">
          <p class="eyebrow">Local ledger</p>
          <h2 id="ledger-title">Recent tickets</h2>
          ${state.tickets.length ? `<ol class="ticket-list">${state.tickets.slice(-5).reverse().map((ticket) => `<li><span class="ticket-dot ticket-dot--${ticket.route}"></span><div><strong>${escapeHtml(ticket.noteTitle)}</strong><small>${ticket.route} · ${new Date(ticket.createdAt).toLocaleDateString()}</small></div></li>`).join('')}</ol>` : '<p class="ledger-empty">Your first route will appear here.</p>'}
          ${lastTicket ? `<button class="undo" type="button" data-action="undo">↶ Undo last route</button>` : ''}
          <div class="privacy-stamp"><span aria-hidden="true">◉</span><p><strong>Local by design</strong><br>Files never leave this device.</p></div>
        </aside>
      </div>
      <section class="settings" id="settings" role="dialog" aria-modal="true" hidden aria-labelledby="settings-title">
        <div class="settings__header"><div><p class="eyebrow">Preferences & license</p><h2 id="settings-title">Desk settings</h2></div><button class="close-button" type="button" data-action="toggle-settings" aria-label="Close settings">×</button></div>
        <div class="settings-grid">
          <div><h3>Ticket folder</h3><label for="ticket-folder">Folder inside your notes</label><div class="input-row"><input id="ticket-folder" value="${escapeHtml(state.ticketFolder)}" ${!unlocked ? 'disabled' : ''}><button class="button button--small" type="button" data-action="save-folder" ${!unlocked ? 'disabled' : ''}>Save</button></div><p>${unlocked ? 'New tickets use this folder. Existing files stay where they are.' : 'Custom folder names are included in the lifetime unlock. Free tickets use .rehearsal.'}</p></div>
          <div><h3>${unlocked ? 'Lifetime unlocked' : 'Unlimited routing'}</h3>${!unlocked && licenseNotice ? `<p class="license-notice" role="status">${escapeHtml(licenseNotice)}. Paste another license or use the purchase link.</p>` : ''}<p>${unlocked ? escapeHtml(licenseNotice) : 'Free routes 30 notes and includes local Markdown tickets plus export. Pay $19 once for unlimited notes and custom ticket folders.'}</p>${unlocked ? '<button class="text-button" type="button" data-action="remove-license">Remove license from this device</button>' : `<a class="button button--primary button--small" href="${CHECKOUT_URL}" target="_blank" rel="noreferrer">Buy lifetime unlock — $19</a><label for="license-token">Have a license? Paste it</label><div class="input-row"><input id="license-token" autocomplete="off" spellcheck="false"><button class="button button--small" type="button" data-action="restore-license">Verify</button></div>`}</div>
          <div><h3>Take your data</h3><p>Export the routing ledger at any time. Ticket files already live in your chosen folder.</p><button class="button button--small" type="button" data-action="export">Export ledger</button></div>
          <div><h3>Reset this extension</h3><p>Forget the folder and local ledger. Ticket files on disk are not deleted.</p><button class="text-button text-button--danger" type="button" data-action="reset">Forget local data</button></div>
        </div>
        <p class="legal-links"><a href="https://note-rehearsal-router.sociobot.in/privacy" target="_blank" rel="noreferrer">Privacy</a><a href="https://note-rehearsal-router.sociobot.in/terms" target="_blank" rel="noreferrer">Terms</a></p>
      </section>
    </main>
    <div class="live-region" role="status" aria-live="polite">${escapeHtml(announcement)}</div>`;
  bindEvents();
}

function announce(message: string): void {
  announcement = message;
  const region = document.querySelector<HTMLElement>('.live-region');
  if (region) region.textContent = message;
}

async function refresh(requestPermission = false): Promise<void> {
  if (!directory) {
    view = 'onboarding';
    render();
    return;
  }
  view = 'loading';
  render();
  try {
    if (!(await hasDirectoryPermission(directory, requestPermission))) {
      view = 'permission';
      render();
      return;
    }
    notes = await scanMarkdown(directory, state.ticketFolder);
    view = currentQueue().length ? 'ready' : 'empty';
    announce(`Scan complete. ${untriagedNotes(notes, state).length} notes waiting.`);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'The folder could not be read. Check its permission and try again.';
    view = 'error';
  }
  render();
}

async function chooseFolder(): Promise<void> {
  try {
    const picked = await chooseNotesDirectory();
    directory = picked;
    folderName = picked.name;
    await saveDirectoryHandle(picked);
    await refresh(false);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    errorMessage = error instanceof Error ? error.message : 'The folder chooser did not open. Use a recent Chromium browser.';
    view = 'error';
    render();
  }
}

async function routeNote(route: RouteId): Promise<void> {
  const note = currentQueue()[0];
  if (!note || !directory || routing) return;
  routing = true;
  render();
  const ticket = createTicket(note, route);
  try {
    const ticketPath = await writeTicket(directory, state.ticketFolder, ticket);
    state = { ...state, tickets: [...state.tickets, { ...ticket, ticketPath }] };
    await saveState(state);
    view = currentQueue().length ? 'ready' : 'empty';
    announcement = `${note.title} routed to ${route}.`;
  } catch (error) {
    errorMessage = error instanceof Error ? `No ticket was recorded: ${error.message}` : 'No ticket was recorded. Reconnect the folder and try again.';
    view = 'error';
  } finally {
    routing = false;
    render();
    document.querySelector<HTMLElement>('[data-route]')?.focus();
  }
}

async function undoLast(): Promise<void> {
  const ticket = state.tickets.at(-1);
  if (!ticket || !directory) return;
  if (!confirm(`Undo the ${ticket.route} route for “${ticket.noteTitle}” and remove its ticket file?`)) return;
  try {
    await removeTicket(directory, ticket.ticketPath);
    state = { ...state, tickets: state.tickets.slice(0, -1) };
    await saveState(state);
    view = 'ready';
    announcement = `Route for ${ticket.noteTitle} undone.`;
    render();
  } catch (error) {
    errorMessage = error instanceof Error ? `The ledger was kept because the ticket could not be removed: ${error.message}` : 'The ticket could not be removed.';
    view = 'error';
    render();
  }
}

function download(filename: string, contents: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
  announce('Ledger export downloaded.');
}

function toggleSettings(): void {
  const section = document.querySelector<HTMLElement>('#settings');
  const toggle = document.querySelector<HTMLElement>('[data-action="toggle-settings"]');
  if (!section || !toggle) return;
  section.hidden = !section.hidden;
  toggle.setAttribute('aria-expanded', String(!section.hidden));
  for (const element of document.querySelectorAll<HTMLElement>('.topbar, .intro, .desk-grid')) element.inert = !section.hidden;
  if (!section.hidden) section.querySelector<HTMLElement>('button, input, a')?.focus();
  else toggle.focus();
}

function bindEvents(): void {
  document.querySelectorAll<HTMLElement>('[data-route]').forEach((button) => button.addEventListener('click', () => void routeNote(button.dataset.route as RouteId)));
  document.querySelectorAll<HTMLElement>('[data-action]').forEach((element) => element.addEventListener('click', async () => {
    const action = element.dataset.action;
    if (action === 'choose-folder') await chooseFolder();
    if (action === 'request-permission') await refresh(true);
    if (action === 'retry' || action === 'rescan') await refresh(action === 'retry');
    if (action === 'export') download('note-rehearsal-ledger.md', exportMarkdown(state), 'text/markdown');
    if (action === 'undo') await undoLast();
    if (action === 'toggle-settings') toggleSettings();
    if (action === 'save-folder') {
      const input = document.querySelector<HTMLInputElement>('#ticket-folder');
      const value = input?.value.trim().replace(/[\\/:*?"<>|]/g, '-') || DEFAULT_TICKET_FOLDER;
      state = { ...state, ticketFolder: value };
      await saveState(state);
      announce(`New tickets will be written to ${value}.`);
    }
    if (action === 'restore-license') {
      const token = document.querySelector<HTMLInputElement>('#license-token')?.value.trim();
      if (!token) return announce('Paste a license token first.');
      restoreLicense(token);
      const result = await verifyLicense(true);
      unlocked = result.unlocked;
      licenseNotice = result.notice;
      announce(result.notice);
      render();
    }
    if (action === 'remove-license') {
      clearLicense();
      unlocked = false;
      licenseNotice = '';
      render();
    }
    if (action === 'reset' && confirm('Forget the chosen folder and local ledger? Ticket files on disk will remain.')) {
      await clearLocalData();
      directory = undefined;
      notes = [];
      state = { version: 1, tickets: [], ticketFolder: DEFAULT_TICKET_FOLDER };
      view = 'onboarding';
      announcement = 'Local browser data cleared. Ticket files on disk were not changed.';
      render();
    }
  }));
}

document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement) return;
  const route = ROUTE_DEFINITIONS.find((candidate) => candidate.key === event.key);
  if (route && view === 'ready') {
    event.preventDefault();
    void routeNote(route.id);
  }
  if (event.key.toLowerCase() === 'r' && directory) void refresh(false);
  if (event.key.toLowerCase() === 'e') download('note-rehearsal-ledger.md', exportMarkdown(state), 'text/markdown');
  const settings = document.querySelector<HTMLElement>('#settings');
  if (event.key === 'Escape' && settings && !settings.hidden) toggleSettings();
  if (event.key === 'Tab' && settings && !settings.hidden) {
    const focusable = [...settings.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href]')];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});

async function initialize(): Promise<void> {
  captureLicenseFromUrl();
  const [loadedState, loadedHandle, license] = await Promise.all([loadState(), loadDirectoryHandle().catch(() => undefined), verifyLicense()]);
  state = loadedState;
  directory = loadedHandle;
  folderName = loadedHandle?.name ?? '';
  unlocked = license.unlocked;
  licenseNotice = license.notice;
  await refresh(false);
  initialized = true;
}

render();
void initialize();

window.addEventListener('focus', () => {
  const settingsOpen = !document.querySelector<HTMLElement>('#settings')?.hidden;
  if (initialized && directory && !routing && !settingsOpen) void refresh(false);
});
