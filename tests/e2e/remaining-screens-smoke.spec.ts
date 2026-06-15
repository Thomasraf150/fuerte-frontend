/**
 * Remaining-screens smoke test across roles.
 *
 * Catches BOTH failure modes seen during the branch-isolation rollout:
 *   ❌ ERROR  — auth/null crash (token-less fetch to a now-authed resolver)
 *   ⚠️ EMPTY  — "no records" with no error (the SOA capped-page/client-search trap)
 *
 * Hard-fails only on ERROR; logs EMPTY for human review (some screens are
 * legitimately empty until a date range is chosen).
 */
import { test, expect, Page } from '@playwright/test';

const FRONTEND = 'http://localhost:3000';
const PW = 'Fuerte2026!';

const ERROR_PATTERNS = [
  'Cannot read properties of null',
  'Cannot read properties of undefined',
  'Error loading',
  'Unauthenticated',
  'Internal server error',
  'is not a function',
];
const EMPTY_PATTERNS = [
  'no records to display',
  'no data to display',
  'no records found',
];

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

async function checkScreens(page: Page, label: string, screens: { name: string; path: string }[]): Promise<string[]> {
  const errors: string[] = [];
  for (const s of screens) {
    await page.goto(`${FRONTEND}${s.path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2800);
    const body = ((await page.locator('body').innerText().catch(() => '')) || '').toLowerCase();
    const err = ERROR_PATTERNS.find((p) => body.includes(p.toLowerCase()));
    const empty = EMPTY_PATTERNS.find((p) => body.includes(p.toLowerCase()));
    const status = err ? `❌ ERROR "${err}"` : empty ? `⚠️ EMPTY` : '✅ ok';
    console.log(`[${label}] ${status}  —  ${s.name} (${s.path})`);
    if (err) errors.push(`${s.name} (${s.path}): ${err}`);
  }
  return errors;
}

test('ACCOUNTING — financial (expect data) + operational (scoped)', async ({ page }) => {
  test.setTimeout(300_000);
  await uiLoginAs(page, 'dondonacctg@gmail.com', PW);
  const errors = await checkScreens(page, 'ACCTG', [
    { name: 'General Ledger', path: '/accounting/general-ledger' },
    { name: 'Trial Balance', path: '/accounting/unadjusted-trial-balance' },
    { name: 'Balance Sheet', path: '/accounting/balance-sheet' },
    { name: 'Chart of Accounts', path: '/accounting/coa' },
    { name: 'Commission Schedule', path: '/commission-schedule' },
    { name: 'Adjusting Entries', path: '/accounting/adjusting-entries' },
    { name: 'General Journal', path: '/accounting/general-journal' },
    { name: 'General Voucher', path: '/accounting/general-voucher' },
    { name: 'Collection List (op)', path: '/collection-list' },
    { name: 'Problem Accounts (op)', path: '/problem-accounts' },
    { name: 'Notes Receivable', path: '/notes-receivable' },
  ]);
  expect(errors, `ACCOUNTING hard errors:\n${errors.join('\n')}`).toEqual([]);
});

test('OWNER — income statement + balance sheet + lists', async ({ page }) => {
  test.setTimeout(180_000);
  await uiLoginAs(page, 'fuerterafael@gmail.com', PW);
  const errors = await checkScreens(page, 'OWNER', [
    { name: 'Income Statement', path: '/accounting/income-statement' },
    { name: 'Balance Sheet', path: '/accounting/balance-sheet' },
    { name: 'General Ledger', path: '/accounting/general-ledger' },
    { name: 'Borrowers', path: '/borrowers' },
    { name: 'Collection List', path: '/collection-list' },
  ]);
  expect(errors, `OWNER hard errors:\n${errors.join('\n')}`).toEqual([]);
});

test('ADMIN — sees-all regression', async ({ page }) => {
  test.setTimeout(180_000);
  await uiLoginAs(page, 'locked.2.heidiadmin@gmail.com', PW);
  const errors = await checkScreens(page, 'ADMIN', [
    { name: 'Borrowers', path: '/borrowers' },
    { name: 'Collection List', path: '/collection-list' },
    { name: 'Payment Posting', path: '/payment-posting' },
    { name: 'General Ledger', path: '/accounting/general-ledger' },
    { name: 'Chart of Accounts', path: '/accounting/coa' },
    { name: 'Statement of Account', path: '/statement-of-account' },
  ]);
  expect(errors, `ADMIN hard errors:\n${errors.join('\n')}`).toEqual([]);
});

test('BRANCH ADMIN — multi-sub branch', async ({ page }) => {
  test.setTimeout(180_000);
  await uiLoginAs(page, 'admin@gmail.com', '123456'); // local: admin@gmail.com uses 123456
  const errors = await checkScreens(page, 'BR-ADMIN', [
    { name: 'Borrowers', path: '/borrowers' },
    { name: 'Loans List', path: '/loans-list' },
    { name: 'Collection List', path: '/collection-list' },
    { name: 'Payment Posting', path: '/payment-posting' },
    { name: 'Statement of Account', path: '/statement-of-account' },
    { name: 'Problem Accounts', path: '/problem-accounts' },
    { name: 'Dashboard', path: '/' },
  ]);
  expect(errors, `BR-ADMIN hard errors:\n${errors.join('\n')}`).toEqual([]);
});
