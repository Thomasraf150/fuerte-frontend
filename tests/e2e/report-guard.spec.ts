/**
 * ReportGuard: the Balance Sheet (a consolidated financial report) must only be
 * reachable by Admin/Owner/Accounting (mirrors backend canViewAllBranchReports).
 * Other roles hitting the URL directly are redirected to the dashboard.
 */
import { test, expect, Page } from '@playwright/test';

const FRONTEND = 'http://localhost:3000';
const PW = 'Fuerte2026!';

async function uiLoginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${FRONTEND}/auth/signin`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  await page.waitForTimeout(800);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.toString().includes('/auth/signin'), { timeout: 20000 });
  await page.waitForTimeout(1500);
}

test('Balance Sheet: Branch Admin is redirected, report-viewers are allowed', async ({ page }) => {
  test.setTimeout(120_000);

  // Branch Admin (BRADM) — NOT a report viewer → redirected off the page.
  await uiLoginAs(page, 'admin@gmail.com', '123456'); // local: admin@gmail.com uses 123456
  const role = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('authStore') ?? '{}')?.state?.user?.role?.code; } catch { return 'ERR'; }
  });
  console.log('BRANCH ADMIN role.code =', role);
  await page.goto(`${FRONTEND}/accounting/balance-sheet`, { waitUntil: 'domcontentloaded' });
  // Guard redirects client-side — wait for the URL to move off balance-sheet (don't assume a fixed delay).
  await page.waitForURL((u) => !u.toString().includes('/accounting/balance-sheet'), { timeout: 12000 }).catch(() => {});
  console.log('BRANCH ADMIN url after BS nav:', page.url());
  expect(page.url(), 'branch admin should be redirected off balance-sheet').not.toContain('/accounting/balance-sheet');

  // Owner (OWN) — report viewer → stays on the page, form renders.
  await uiLoginAs(page, 'fuerterafael@gmail.com', PW);
  await page.goto(`${FRONTEND}/accounting/balance-sheet`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  console.log('OWNER url after BS nav:', page.url());
  expect(page.url(), 'owner should stay on balance-sheet').toContain('/accounting/balance-sheet');
  expect(await page.locator('body').innerText()).toContain('Select Date Range');

  // Accounting (ACCTG) — report viewer → allowed.
  await uiLoginAs(page, 'dondonacctg@gmail.com', PW);
  await page.goto(`${FRONTEND}/accounting/balance-sheet`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  console.log('ACCTG url after BS nav:', page.url());
  expect(page.url(), 'accounting should stay on balance-sheet').toContain('/accounting/balance-sheet');
});
