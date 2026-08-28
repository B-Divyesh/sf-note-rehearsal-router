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
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(consoleErrors).toEqual([]);
  } finally {
    await context.close();
  }
});
