import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  page.on('console', (message) => {
    if (message.type() === 'error') throw new Error(`Console error: ${message.text()}`);
  });
});

test('landing first screen names the job, audience, first action, and three facts', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Note Rehearsal Router — Route Markdown notes');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Route Markdown notes into learning actions' })).toBeVisible();
  await expect(page.getByText(/For self-learners/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await expect(page.locator('.hero-facts li')).toHaveCount(3);
  await expect(page.locator('.hero-art img')).toHaveJSProperty('complete', true);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('landing metadata names and previews the product', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://note-rehearsal-router.sociobot.in/');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/icon/apple-touch-icon.png');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-card\.jpg$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  expect((await page.title()).length).toBeLessThanOrEqual(60);
  expect((await page.locator('meta[name="description"]').getAttribute('content'))?.length).toBeLessThanOrEqual(155);
});

test('responsive layout and 200 percent text fit a narrow phone', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile project only');
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, body: document.body.scrollWidth, root: document.documentElement.scrollWidth }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.root).toBeLessThanOrEqual(dimensions.viewport + 1);
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose one action for each note' })).toBeVisible();
});

test('demo supports keyboard use, focus, reduced motion, and accessible output', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await page.keyboard.press('3');
  await expect(page.locator('#ticket-output')).toContainText('type: teach');
  const reduced = await page.locator('.demo-route').first().evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(['0s', '0.00001s', '1e-05s']).toContain(reduced);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('license return is saved, stripped from the URL, and presented in a modal', async ({ page }) => {
  await page.route('https://api.sociobot.in/**', (route) => route.fulfill({ json: { valid: true, reason: 'ok' } }));
  await page.goto('/?license=test_local_token');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Copy your license into the extension' })).toBeVisible();
  await expect(page.locator('#returned-license')).toHaveText('test_local_token');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:note-rehearsal-router'))).toBe('test_local_token');
  await expect(page.locator('#license-status')).toHaveText('License verified.');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

for (const [path, title] of [
  ['/demo/', 'Demo — Note Rehearsal Router'],
  ['/privacy/', 'Privacy — Note Rehearsal Router'],
  ['/terms/', 'Terms — Note Rehearsal Router'],
  ['/404.html', 'Page not found — Note Rehearsal Router']
] as const) {
  test(`${path} has its own title and standard semantic structure`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('header nav')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  });
}

test('static host configuration serves the designed 404 and a header-only CSP', async ({ page }) => {
  const config = JSON.parse(await readFile('dist/site/staticwebapp.config.json', 'utf8')) as { globalHeaders: Record<string, string>; responseOverrides: Record<string, { rewrite: string }> };
  expect(config.responseOverrides['404'].rewrite).toBe('/404.html');
  expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { name: 'This page was not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return home' })).toBeVisible();
});

test('every internal page link resolves and every download exists', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page.locator('a[href]').evaluateAll((anchors) => [...new Set(anchors.map((anchor) => (anchor as HTMLAnchorElement).href))]);
  for (const href of hrefs) {
    const target = new URL(href);
    if (target.origin !== 'http://127.0.0.1:4173') continue;
    const response = await request.get(`${target.origin}${target.pathname}`);
    expect(response.ok(), href).toBe(true);
  }
});
