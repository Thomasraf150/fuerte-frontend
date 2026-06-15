/**
 * SOA search fix: the Statement-of-Account list now uses server-side search
 * (like Borrowers/Loans) instead of a capped, client-side, case-sensitive
 * filter — so any loan in the branch is findable and its ledger opens.
 */
import { test, expect, Page } from '@playwright/test';

const FRONTEND = 'http://localhost:3000';
const BRANCH_USER = { email: 'annasandiego@gmail.com', password: 'Fuerte2026!' };

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

test('SOA: lowercase server-side search finds an OLD loan and opens its ledger', async ({ page }) => {
  test.setTimeout(120_000);
  await uiLoginAs(page, BRANCH_USER.email, BRANCH_USER.password);

  await page.goto(`${FRONTEND}/statement-of-account`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Lowercase on purpose — proves case-insensitive + server-side (MA-0123 is an
  // old loan that was NOT in the old capped first page).
  const search = page.locator('input[placeholder*="Search"]').first();
  await search.fill('ma-0123');
  await page.waitForTimeout(3000); // server-side fetch

  await expect(page.getByText('MA-0123', { exact: false }).first()).toBeVisible({ timeout: 10000 });
  console.log('✅ search found MA-0123 (lowercase, server-side)');

  await page.getByText('MA-0123', { exact: false }).first().click();
  await page.waitForURL(/statement-of-account\/\d+/, { timeout: 15000 });
  await page.waitForTimeout(3000);

  const body = await page.locator('body').innerText();
  expect(body).not.toContain('There are no records to display');
  expect(body).not.toContain('Cannot read properties of null');
  console.log('✅ ledger loaded for MA-0123 (no empty/error state)');
});
