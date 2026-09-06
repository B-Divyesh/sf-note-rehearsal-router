import AxeBuilder from '@axe-core/playwright';
import { chromium, expect, test } from '@playwright/test';
import { resolve } from 'node:path';

test('built extension opens a keyboard-accessible local onboarding desk without console errors', async ({ isMobile }) => {
  test.skip(isMobile, 'extension shell is covered once with desktop Chromium');
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    let [worker] = context.serviceWorkers();
    worker ??= await context.waitForEvent('serviceworker', { timeout: 10_000 });
    const extensionId = new URL(worker.url()).host;
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.goto(`chrome-extension://${extensionId}/app.html`);
    await expect(page).toHaveTitle(/Rehearsal desk/);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Choose a Markdown folder' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Try it with sample data' })).toHaveAttribute('href', 'https://note-rehearsal-router.sociobot.in/demo/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    const smallestText = await page.evaluate(() => Math.min(...[...document.querySelectorAll<HTMLElement>('body *')]
      .filter((element) => element.offsetParent !== null && (element.textContent ?? '').trim() && !element.matches('.live-region'))
      .map((element) => Number.parseFloat(getComputedStyle(element).fontSize))));
    expect(smallestText).toBeGreaterThanOrEqual(16);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(consoleErrors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('installed extension routes a browser-owned sample folder end to end', async ({ isMobile }) => {
  test.skip(isMobile, 'extension integration uses one clean desktop Chromium profile');
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    let [worker] = context.serviceWorkers();
    worker ??= await context.waitForEvent('serviceworker', { timeout: 10_000 });
    const page = await context.newPage();
    await page.goto(`chrome-extension://${new URL(worker.url()).host}/app.html`);
    await expect(page.getByRole('heading', { name: 'Choose a Markdown folder' })).toBeVisible();
    const source = '# Browser sample note\n\nExplain why testing the installed artifact catches integration gaps.';
    await page.evaluate(async (contents) => {
      const root = await navigator.storage.getDirectory();
      const file = await root.getFileHandle('browser-sample.md', { create: true });
      const writable = await file.createWritable();
      await writable.write(contents);
      await writable.close();
      Object.defineProperty(window, 'showDirectoryPicker', { configurable: true, value: async () => root });
    }, source);
    await page.getByRole('button', { name: 'Choose notes folder' }).click();
    await expect(page.getByRole('heading', { name: 'Browser sample note' })).toBeVisible();
    await page.getByRole('button', { name: /Recall/ }).click();
    await expect(page.getByRole('heading', { name: 'Every found note has a direction' })).toBeVisible();
    const result = await page.evaluate(async () => {
      const root = await navigator.storage.getDirectory();
      const sourceFile = await root.getFileHandle('browser-sample.md');
      const sourceContents = await (await sourceFile.getFile()).text();
      const ticketFolder = await root.getDirectoryHandle('.rehearsal');
      const ticketNames: string[] = [];
      let ticketContents = '';
      for await (const [name, handle] of ticketFolder.entries()) {
        ticketNames.push(name);
        if (handle.kind === 'file') ticketContents = await (await handle.getFile()).text();
      }
      const stored = await chrome.storage.local.get('router-state');
      return { sourceContents, ticketNames, ticketContents, ticketCount: stored['router-state'].tickets.length };
    });
    expect(result.sourceContents).toBe(source);
    expect(result.ticketNames).toHaveLength(1);
    expect(result.ticketContents).toContain('type: recall');
    expect(result.ticketContents).toContain('- [ ] Done');
    expect(result.ticketCount).toBe(1);
  } finally {
    await context.close();
  }
});
