/**
 * DETERMINISTIC search-race proof. We intercept the GraphQL endpoint and delay
 * the BROAD search response so it is GUARANTEED to resolve AFTER the specific
 * search. Only a working stale-response guard yields the specific result.
 *
 * Proven via negative control: with the usePagination guard disabled, the
 * delayed broad "tela" response (984 rows) overwrites and the final shows 984;
 * with the guard, the stale response is discarded and the final shows 1.
 *
 * Uses expect.toPass to wait out dev-mode mount-fetch transients.
 */
import { test, expect, Page } from '@playwright/test';

const FRONTEND = 'http://localhost:3000';
const ADMIN = { email: 'locked.2.heidiadmin@gmail.com', password: 'Fuerte2026!' };

async function uiLoginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${FRONTEND}/auth/signin`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  if (!page.url().includes('/auth/signin')) {
    await page.goto(`${FRONTEND}/auth/signin`, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForTimeout(800);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.toString().includes('/auth/signin'), { timeout: 20000 });
  await page.waitForTimeout(1500);
}

function totalOf(body: string): number {
  const m = body.match(/of\s+(\d[\d,]*)/i);
  return m ? parseInt(m[1].replace(/,/g, ''), 10) : -1;
}

async function delayBroad(page: Page, marker: string, ms = 2500) {
  await page.route('**/fuerte-api', async (route) => {
    const body = route.request().postData() || '';
    if (body.includes(marker)) await new Promise((r) => setTimeout(r, ms));
    await route.continue();
  });
}

test('usePagination (SOA): delayed broad response is discarded → specific wins', async ({ page }) => {
  test.setTimeout(120_000);
  await uiLoginAs(page, ADMIN.email, ADMIN.password);
  await delayBroad(page, '"search":"tela"');
  await page.goto(`${FRONTEND}/statement-of-account`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const search = page.locator('input[placeholder*="Search"]').first();
  await search.fill('tela');
  await page.waitForTimeout(900);
  await search.fill('tela-0001');

  // Wait out mount-fetch transients + the delayed broad response; final must be
  // the specific match (1), never the stale broad (984).
  await expect(async () => {
    const body = await page.locator('body').innerText();
    expect(body).toContain('TELA-0001');
    const t = totalOf(body);
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThan(50);
  }).toPass({ timeout: 18000, intervals: [1000, 1000, 1000] });
});

test('custom hook (Problem Accounts): delayed broad response is discarded → specific wins', async ({ page }) => {
  test.setTimeout(120_000);
  await uiLoginAs(page, ADMIN.email, ADMIN.password);
  await delayBroad(page, '"searchTerm":"ma"');
  await page.goto(`${FRONTEND}/problem-accounts`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);

  const search = page.locator('input[placeholder*="Loan ref"]').first();
  await search.fill('ma');
  await page.waitForTimeout(1000);
  await search.fill('ma-01');

  await expect(async () => {
    expect(await search.inputValue()).toBe('ma-01');
    const t = totalOf(await page.locator('body').innerText());
    expect(t).toBeGreaterThanOrEqual(0);
    expect(t).toBeLessThan(50); // specific "ma-01" (≈6), never the stale broad "ma"
  }).toPass({ timeout: 18000, intervals: [1000, 1000, 1000] });
});
