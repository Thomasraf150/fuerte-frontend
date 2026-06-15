/**
 * Search race regression: typing in bursts used to let a stale broad-match
 * response ("tela" → many rows) land after the specific one ("tela-0001"),
 * showing wrong results until you retyped. usePagination now discards stale
 * out-of-order responses. Run on the SOA page (admin sees all branches) which
 * has a known "Search ..." placeholder.
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
    () => !document.body.innerText.toLowerCase().includes('loading data'),
    { timeout: 20000 },
  ).catch(() => {});
  await page.waitForTimeout(1200);
}

test('SOA search: burst typing lands on the specific result, not a stale broad match', async ({ page }) => {
  test.setTimeout(120_000);
  await uiLoginAs(page, ADMIN.email, ADMIN.password);
  await page.goto(`${FRONTEND}/statement-of-account`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const search = page.locator('input[placeholder*="Search"]').first();

  // Sanity: a plain specific search returns the right loan.
  await search.fill('tela-0001');
  await settle(page);
  let body = await page.locator('body').innerText();
  console.log('after fill tela-0001:', body.match(/Showing[^\n]*/i)?.[0]);
  expect(body).toContain('TELA-0001');

  // Now the RACE: clear, type "tela" (pause past the 300ms debounce → broad fetch),
  // then finish "-0001" so the specific fetch fires while the broad one resolves.
  await search.fill('');
  await settle(page);
  await search.type('tela', { delay: 60 });
  await page.waitForTimeout(450);
  await search.type('-0001', { delay: 60 });
  await settle(page);

  body = await page.locator('body').innerText();
  console.log('after burst tela-0001:', body.match(/Showing[^\n]*/i)?.[0]);
  expect(body).toContain('TELA-0001');
  const m = body.match(/of\s+(\d[\d,]*)/i);
  const total = m ? parseInt(m[1].replace(/,/g, ''), 10) : -1;
  console.log(`final total = ${total}`);
  expect(total).toBeGreaterThan(0);
  expect(total).toBeLessThan(50); // specific match, NOT the broad stale set
});
