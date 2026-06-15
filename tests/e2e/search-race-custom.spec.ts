/**
 * Race fix for the custom (non-usePagination) search hooks. Problem Accounts
 * uses useProblemAccountsPaginated, which now has a stale-response guard.
 * Strategy: get the TRUE result count for a term via a clean fill, then induce
 * the race with burst typing and assert it lands on the SAME count.
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

async function settle(page: Page) {
  await page.waitForFunction(
    () => !document.body.innerText.toLowerCase().includes('loading'),
    { timeout: 20000 },
  ).catch(() => {});
  await page.waitForTimeout(1200);
}

function countOf(body: string): number {
  const m = body.match(/of\s+(\d[\d,]*)/i);
  return m ? parseInt(m[1].replace(/,/g, ''), 10) : -1;
}

test('problem accounts search: burst typing lands on the same count as a clean search', async ({ page }) => {
  test.setTimeout(120_000);
  await uiLoginAs(page, ADMIN.email, ADMIN.password);
  await page.goto(`${FRONTEND}/problem-accounts`, { waitUntil: 'domcontentloaded' });
  await settle(page);

  const search = page.locator('input[placeholder*="Loan ref"]').first();

  // Establish the correct count for "ma-01" via a single clean fill.
  await search.fill('ma-01');
  await settle(page);
  let body = await page.locator('body').innerText();
  const cleanCount = countOf(body);
  console.log(`clean "ma-01" count = ${cleanCount}`);
  expect(body).not.toContain('Cannot read properties');

  // Reset, then induce the race: broad "ma" (pause past debounce) then "-01".
  await search.fill('');
  await settle(page);
  await search.type('ma', { delay: 60 });
  await page.waitForTimeout(600);
  await search.type('-01', { delay: 60 });
  await settle(page);

  body = await page.locator('body').innerText();
  const burstCount = countOf(body);
  console.log(`burst "ma-01" count = ${burstCount}`);
  expect(await search.inputValue()).toBe('ma-01');
  expect(body).not.toContain('Cannot read properties');
  // The burst must settle on the SAME result as the clean search — not a stale
  // broad "ma" count.
  expect(burstCount).toBe(cleanCount);
});
