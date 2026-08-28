import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('console', (message) => {
    if (message.type() === 'error') throw new Error(`Console error: ${message.text()}`);
  });
});

test('landing page communicates the local routing job and meets the accessibility baseline', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Note Rehearsal Router/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Give every note/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download for Chrome' })).toHaveAttribute('download', '');
  await expect(page.locator('.hero-art img')).toHaveJSProperty('complete', true);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('responsive layout fits a narrow phone without horizontal overflow', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile project only');
  await page.goto('/');
  const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
  await expect(page.getByRole('link', { name: /Download/, exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'A deliberate five-way junction.' })).toBeVisible();
});

test('license return is saved, stripped from the URL, and clearly handed to the extension', async ({ page }) => {
  await page.route('https://api.sociobot.in/**', (route) => route.fulfill({ json: { valid: true, reason: 'ok' } }));
  await page.goto('/?license=test_local_token');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Your license is ready.' })).toBeVisible();
  await expect(page.locator('#returned-license')).toHaveText('test_local_token');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:note-rehearsal-router'))).toBe('test_local_token');
  await expect(page.locator('#license-status')).toHaveText('License verified.');
});

for (const path of ['/privacy/', '/terms/']) {
  test(`${path} has a titled semantic document`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  });
}
