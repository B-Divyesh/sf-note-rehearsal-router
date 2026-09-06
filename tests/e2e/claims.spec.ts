import { chromium, expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { scanMarkdown, writeTicket } from '../../lib/filesystem';
import { availableNotes, createTicket, exportMarkdown, FREE_NOTE_LIMIT, initialState } from '../../lib/router';
import { createSampleState, SAMPLE_NOTES } from '../../lib/sample';
import type { NoteRecord, RouterState, TicketRecord } from '../../lib/types';
import { MemoryDirectoryHandle, MemoryFileHandle } from '../helpers/memory-filesystem';

const DEMO_KEY = 'demo:note-rehearsal-router:state';

test.beforeEach(async ({ isMobile }) => {
  test.skip(isMobile, 'claim commands use one fresh desktop sandbox');
});

async function openCleanDemo(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/demo/');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
}

async function extensionPage(routeHandler?: Parameters<Awaited<ReturnType<typeof chromium.launchPersistentContext>>['route']>[1]) {
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  if (routeHandler) await context.route('https://api.sociobot.in/**', routeHandler);
  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker', { timeout: 10_000 });
  const extensionId = new URL(worker.url()).host;
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/app.html`);
  return { context, page };
}

test('@claim:demo-sandbox opens populated sample data, resets it, and never changes real keys', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('router-state', 'real-ledger');
    localStorage.setItem('sb_license:note-rehearsal-router', 'real-license');
  });
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo\/$/);
  await expect(page.getByText('1 routed · 3 waiting')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Estimate before calculating' })).toBeVisible();
  await page.getByRole('button', { name: /Solve/ }).click();
  await expect(page.getByText('2 routed · 2 waiting')).toBeVisible();
  expect(await page.evaluate(() => ({ real: localStorage.getItem('router-state'), license: localStorage.getItem('sb_license:note-rehearsal-router'), demo: localStorage.getItem('demo:note-rehearsal-router:state') }))).toMatchObject({ real: 'real-ledger', license: 'real-license', demo: expect.any(String) });
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('1 routed · 3 waiting')).toBeVisible();
  expect(requests.every((request) => new URL(request).origin === 'http://127.0.0.1:4173')).toBe(true);
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/#install$/);
  expect(await page.evaluate(() => ({ demo: localStorage.getItem('demo:note-rehearsal-router:state'), real: localStorage.getItem('router-state') }))).toEqual({ demo: null, real: 'real-ledger' });
});

test('@claim:one-note-advance shows one current note and advances after one route', async ({ page }) => {
  await openCleanDemo(page);
  await expect(page.locator('.note-sheet h2')).toHaveCount(1);
  const first = await page.locator('.note-sheet h2').textContent();
  await page.getByRole('button', { name: /Teach/ }).click();
  await expect(page.locator('.note-sheet h2')).not.toHaveText(first ?? '');
  await expect(page.locator('.note-sheet h2')).toHaveCount(1);
  await expect(page.getByText('2 routed · 2 waiting')).toBeVisible();
});

test('@claim:five-ticket-routes creates exactly one actionable ticket for every route', async ({ page }) => {
  await openCleanDemo(page);
  for (const route of ['Recall', 'Solve', 'Teach', 'Do', 'Archive']) {
    await page.getByRole('button', { name: 'Reset demo' }).click();
    const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').tickets.length, DEMO_KEY);
    await page.getByRole('button', { name: new RegExp(`^${route}`) }).click();
    const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').tickets, DEMO_KEY) as TicketRecord[];
    expect(after).toHaveLength(before + 1);
    expect(after.at(-1)?.route).toBe(route.toLowerCase());
    await expect(page.locator('#ticket-output')).toContainText(`type: ${route.toLowerCase()}`);
    await expect(page.locator('#ticket-output')).toContainText('- [ ] Done');
  }
});

test('@claim:separate-ticket-source-safe writes a separate .rehearsal ticket without changing the sample source', async ({ page }) => {
  await openCleanDemo(page);
  const root = new MemoryDirectoryHandle('sample-notes');
  const source = new MemoryFileHandle('estimate-first.md', SAMPLE_NOTES[1].body, 3);
  root.entriesMap.set(source.name, source);
  const before = await (await source.getFile()).text();
  const [note] = await scanMarkdown(root as unknown as FileSystemDirectoryHandle, '.rehearsal');
  const path = await writeTicket(root as unknown as FileSystemDirectoryHandle, '.rehearsal', createTicket(note, 'solve', new Date('2026-09-06T00:00:00Z')));
  const tickets = root.entriesMap.get('.rehearsal') as MemoryDirectoryHandle;
  expect(path).toMatch(/^\.rehearsal\/2026-09-06-solve-/);
  expect(tickets.written.size).toBe(1);
  expect([...tickets.written.values()][0]).toContain('status: queued');
  expect(await (await source.getFile()).text()).toBe(before);
});

test('@claim:manual-routing-only waits for a choice and keeps the note text intact', async ({ page }) => {
  await openCleanDemo(page);
  const initial = await page.evaluate((key) => localStorage.getItem(key), DEMO_KEY);
  await page.waitForTimeout(300);
  expect(await page.evaluate((key) => localStorage.getItem(key), DEMO_KEY)).toBe(initial);
  await expect(page.locator('.note-sheet')).toContainText(SAMPLE_NOTES[1].excerpt);
  await expect(page.locator('[data-route][aria-pressed="true"]')).toHaveCount(0);
});

test('@claim:folder-page-scope scans only the supplied folder and ships no page-reading permission', async ({ page }) => {
  await openCleanDemo(page);
  const chosen = new MemoryDirectoryHandle('chosen');
  chosen.entriesMap.set('inside.md', new MemoryFileHandle('inside.md', '# Inside'));
  const outside = new MemoryDirectoryHandle('outside');
  outside.entriesMap.set('private.md', new MemoryFileHandle('private.md', '# Private'));
  const scanned = await scanMarkdown(chosen as unknown as FileSystemDirectoryHandle, '.rehearsal');
  expect(scanned.map((note) => note.name)).toEqual(['inside.md']);
  const manifest = JSON.parse(await readFile(resolve('dist/extension/chrome-mv3/manifest.json'), 'utf8')) as Record<string, unknown>;
  expect(manifest.permissions).toEqual(['storage']);
  expect(manifest).not.toHaveProperty('host_permissions');
  expect(manifest).not.toHaveProperty('content_scripts');
});

test('@claim:rescan-refresh adds a new Markdown note on the next scan', async ({ page }) => {
  await openCleanDemo(page);
  const root = new MemoryDirectoryHandle('chosen');
  root.entriesMap.set('first.md', new MemoryFileHandle('first.md', '# First'));
  expect(await scanMarkdown(root as unknown as FileSystemDirectoryHandle, '.rehearsal')).toHaveLength(1);
  root.entriesMap.set('second.md', new MemoryFileHandle('second.md', '# Second'));
  expect((await scanMarkdown(root as unknown as FileSystemDirectoryHandle, '.rehearsal')).map((note) => note.title).sort()).toEqual(['First', 'Second']);
});

test('@claim:free-limit allows 30 routes before holding the remaining queue', async ({ page }) => {
  await openCleanDemo(page);
  const notes: NoteRecord[] = Array.from({ length: 31 }, (_, index) => ({ ...SAMPLE_NOTES[1], id: `note-${index}`, path: `${index}.md`, name: `${index}.md` }));
  const empty = initialState();
  expect(availableNotes(notes, empty, false)).toHaveLength(FREE_NOTE_LIMIT);
  const tickets = notes.slice(0, FREE_NOTE_LIMIT).map((note, index) => ({ ...createTicket(note, 'recall', new Date(1_700_000_000_000 + index)), ticketPath: `.rehearsal/${index}.md` }));
  const state: RouterState = { ...empty, tickets };
  expect(availableNotes(notes, state, false)).toHaveLength(0);
  expect(availableNotes(notes, state, true)).toHaveLength(1);
});

test('@claim:undo-route restores the last sample note and removes its ledger entry', async ({ page }) => {
  await openCleanDemo(page);
  const title = await page.locator('.note-sheet h2').textContent();
  await page.getByRole('button', { name: /Do/ }).click();
  await expect(page.getByText('2 routed · 2 waiting')).toBeVisible();
  await page.getByRole('button', { name: 'Undo last route' }).click();
  await expect(page.getByText('1 routed · 3 waiting')).toBeVisible();
  await expect(page.locator('.note-sheet h2')).toHaveText(title ?? '');
});

test('@claim:ledger-export downloads Markdown with one row for every sample ticket', async ({ page }) => {
  await openCleanDemo(page);
  await page.getByRole('button', { name: /Recall/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export sample ledger' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let contents = '';
  for await (const chunk of stream) contents += chunk.toString();
  expect(download.suggestedFilename()).toBe('note-rehearsal-demo-ledger.md');
  expect((contents.match(/^## /gm) ?? [])).toHaveLength(2);
  expect(contents).toContain('RECALL — Estimate before calculating');
});

test('@claim:paid-license enables unlimited routing and custom ticket folders after valid verification', async ({ page }) => {
  await openCleanDemo(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pay $19 once for unlimited routing' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy the one-time license' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/note-rehearsal-router/checkout');
  const notes: NoteRecord[] = Array.from({ length: 31 }, (_, index) => ({ ...SAMPLE_NOTES[1], id: `paid-note-${index}`, path: `${index}.md`, name: `${index}.md` }));
  const paidTickets = notes.slice(0, 30).map((note, index) => ({ ...createTicket(note, 'recall', new Date(1_700_100_000_000 + index)), ticketPath: `.rehearsal/${index}.md` }));
  expect(availableNotes(notes, { ...initialState(), tickets: paidTickets }, true)).toHaveLength(1);
  const { context, page: extension } = await extensionPage((route) => route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } }));
  try {
    await extension.getByRole('button', { name: /Settings/ }).click();
    await extension.getByLabel('Have a license? Paste it').fill('fixture-valid-license');
    await extension.getByRole('button', { name: 'Verify' }).click();
    await extension.getByRole('button', { name: /Settings/ }).click();
    await expect(extension.getByRole('heading', { name: 'Lifetime unlocked' })).toBeVisible();
    const folder = extension.getByLabel('Folder inside your notes');
    await expect(folder).toBeEnabled();
    await folder.fill('practice-tickets');
    await extension.getByRole('button', { name: 'Save' }).click();
    const storedFolder = await extension.evaluate(async () => (await chrome.storage.local.get('router-state'))['router-state'].ticketFolder);
    expect(storedFolder).toBe('practice-tickets');
  } finally {
    await context.close();
  }
});

test('@claim:license-revocation locks paid settings after a revoked result', async ({ page }) => {
  await openCleanDemo(page);
  const { context, page: extension } = await extensionPage((route) => route.fulfill({ json: { valid: false, reason: 'revoked', expires_at: null } }));
  try {
    await extension.evaluate(() => localStorage.setItem('sb_license:note-rehearsal-router', 'fixture-revoked-license'));
    await extension.reload();
    await extension.getByRole('button', { name: /Settings/ }).click();
    await expect(extension.getByText('License no longer active. Paste another license or use the purchase link.')).toBeVisible();
    await expect(extension.getByLabel('Folder inside your notes')).toBeDisabled();
  } finally {
    await context.close();
  }
});

test('@claim:checkout-boundary links to Sociobot without collecting payment details on the product site', async ({ page }) => {
  await openCleanDemo(page);
  await page.goto('/');
  const checkout = page.getByRole('link', { name: 'Buy the one-time license' });
  await expect(checkout).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/note-rehearsal-router/checkout');
  await expect(page.locator('input, iframe')).toHaveCount(0);
  const resourceOrigins = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => new URL(entry.name).origin));
  expect(resourceOrigins.every((origin) => origin === 'http://127.0.0.1:4173')).toBe(true);
});

test('@claim:license-token-cache sends only the token and reuses a one-day verdict', async ({ page }) => {
  await openCleanDemo(page);
  const requests: string[] = [];
  const { context, page: extension } = await extensionPage((route) => {
    requests.push(route.request().url());
    return route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } });
  });
  try {
    await extension.evaluate(() => localStorage.setItem('sb_license:note-rehearsal-router', 'fixture token'));
    await extension.reload();
    await expect.poll(() => requests.length).toBe(1);
    await extension.reload();
    await extension.waitForTimeout(200);
    expect(requests).toHaveLength(1);
    const requestUrl = new URL(requests[0]);
    expect(requestUrl.pathname).toBe('/api/v1/products/note-rehearsal-router/verify');
    expect([...requestUrl.searchParams.entries()]).toEqual([['license', 'fixture token']]);
  } finally {
    await context.close();
  }
});

test('@claim:no-tracking-upload sends no cross-origin request during the complete sample flow', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openCleanDemo(page);
  await page.getByRole('button', { name: /Archive/ }).click();
  await page.getByRole('button', { name: 'Undo last route' }).click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((request) => new URL(request).origin === 'http://127.0.0.1:4173')).toBe(true);
  const { context, page: extension } = await extensionPage();
  try {
    const extensionRequests: string[] = [];
    context.on('request', (request) => extensionRequests.push(request.url()));
    await extension.reload();
    await expect(extension.getByRole('heading', { name: 'Choose a Markdown folder' })).toBeVisible();
    expect(extensionRequests.filter((request) => /^https?:/.test(request))).toEqual([]);
  } finally {
    await context.close();
  }
});

test('@claim:forget-local-data @claim:extension-browser-storage clears browser state and leaves an existing ticket file', async ({ page }) => {
  await openCleanDemo(page);
  const { context, page: extension } = await extensionPage();
  try {
    await extension.evaluate(async () => {
      await chrome.storage.local.set({ 'router-state': { version: 1, ticketFolder: '.rehearsal', tickets: [{ id: 'ticket-1' }] } });
      const root = await navigator.storage.getDirectory();
      const folder = await root.getDirectoryHandle('.rehearsal', { create: true });
      const file = await folder.getFileHandle('kept-ticket.md', { create: true });
      const writable = await file.createWritable();
      await writable.write('# Existing ticket');
      await writable.close();
      await new Promise<void>((resolveRequest, rejectRequest) => {
        const request = indexedDB.open('note-rehearsal-router', 1);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction('handles', 'readwrite');
          transaction.objectStore('handles').put(root, 'root-directory');
          transaction.oncomplete = () => { database.close(); resolveRequest(); };
          transaction.onerror = () => rejectRequest(transaction.error);
        };
        request.onerror = () => rejectRequest(request.error);
      });
    });
    const storedBeforeReset = await extension.evaluate(async () => {
      const storage = await chrome.storage.local.get('router-state');
      const handle = await new Promise<unknown>((resolveRequest, rejectRequest) => {
        const request = indexedDB.open('note-rehearsal-router', 1);
        request.onsuccess = () => {
          const database = request.result;
          const get = database.transaction('handles', 'readonly').objectStore('handles').get('root-directory');
          get.onsuccess = () => { database.close(); resolveRequest(get.result); };
          get.onerror = () => rejectRequest(get.error);
        };
      });
      return { storage, handlePresent: Boolean(handle) };
    });
    expect(storedBeforeReset.storage).toHaveProperty('router-state');
    expect(storedBeforeReset.handlePresent).toBe(true);
    await extension.getByRole('button', { name: /Settings/ }).click();
    extension.once('dialog', (dialog) => dialog.accept());
    await extension.getByRole('button', { name: 'Forget local data' }).click();
    await expect(extension.getByRole('heading', { name: 'Choose a Markdown folder' })).toBeVisible();
    const result = await extension.evaluate(async () => {
      const storage = await chrome.storage.local.get(null);
      const root = await navigator.storage.getDirectory();
      const folder = await root.getDirectoryHandle('.rehearsal');
      const file = await folder.getFileHandle('kept-ticket.md');
      const contents = await (await file.getFile()).text();
      const handle = await new Promise<unknown>((resolveRequest, rejectRequest) => {
        const request = indexedDB.open('note-rehearsal-router', 1);
        request.onsuccess = () => {
          const database = request.result;
          const get = database.transaction('handles', 'readonly').objectStore('handles').get('root-directory');
          get.onsuccess = () => { database.close(); resolveRequest(get.result); };
          get.onerror = () => rejectRequest(get.error);
        };
      });
      return { storage, contents, handlePresent: Boolean(handle), status: document.querySelector('.live-region')?.textContent };
    });
    expect(result.storage).toEqual({});
    expect(result.handlePresent).toBe(false);
    expect(result.contents).toBe('# Existing ticket');
    expect(result.status).toContain('Local browser data cleared');
  } finally {
    await context.close();
  }
});

test('@claim:offline-free opens the packaged free desk without a hosted service', async ({ page }) => {
  await openCleanDemo(page);
  const { context, page: extension } = await extensionPage();
  try {
    await context.setOffline(true);
    await extension.reload();
    await expect(extension.getByRole('heading', { name: 'Choose a Markdown folder' })).toBeVisible();
    await expect(extension.getByRole('button', { name: 'Choose notes folder' })).toBeEnabled();
  } finally {
    await context.close();
  }
});

test('@claim:keyboard-routes lets number keys choose an action', async ({ page }) => {
  await openCleanDemo(page);
  await page.keyboard.press('2');
  await expect(page.getByText('2 routed · 2 waiting')).toBeVisible();
  await expect(page.locator('#ticket-output')).toContainText('type: solve');
  await expect(page.locator('[data-route]:focus')).toHaveCount(1);
});

test('@claim:browser-storage keeps the sample ledger across reloads in its demo namespace', async ({ page }) => {
  await openCleanDemo(page);
  await page.getByRole('button', { name: /Teach/ }).click();
  const saved = await page.evaluate((key) => localStorage.getItem(key), DEMO_KEY);
  expect(JSON.parse(saved ?? '{}').tickets).toHaveLength(2);
  await page.reload();
  await expect(page.getByText('2 routed · 2 waiting')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), DEMO_KEY)).toBe(saved);
  expect(exportMarkdown(createSampleState())).toContain('RECALL — Why retrieval practice beats rereading');
});
