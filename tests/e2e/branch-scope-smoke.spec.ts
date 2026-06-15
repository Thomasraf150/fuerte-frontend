/**
 * Branch-scope regression smoke test.
 *
 * After the backend branch-isolation fix added per-resolver `auth('api')->user()`,
 * any frontend hook that fetched GraphQL WITHOUT an Authorization header started
 * throwing → the page rendered "Cannot read properties of null (reading 'data')".
 * The central fix attaches the bearer token in fetchWithRecache.
 *
 * This logs in as a branch-scoped user and visits every screen the fix touched,
 * asserting none of them render an auth/null error banner.
 */
import { test, expect, Page } from '@playwright/test';

const FRONTEND = 'http://localhost:3000';
const BRANCH_USER = { email: 'annasandiego@gmail.com', password: 'Fuerte2026!' };

const SCREENS = [
  { name: 'Dashboard (Summary Ticket)', path: '/' },
  { name: 'Borrowers',                  path: '/borrowers' },
  { name: 'Loans List',                 path: '/loans-list' },
  { name: 'Collection List',            path: '/collection-list' },
  { name: 'Payment Posting',            path: '/payment-posting' },
  { name: 'Statement of Account',       path: '/statement-of-account' },
  { name: 'Problem Accounts',           path: '/problem-accounts' },
  { name: 'Notes Receivable',           path: '/notes-receivable' },
];

const ERROR_PATTERNS = [
  'Cannot read properties of null',
  'Error loading',
  'Unauthenticated',
  'Internal server error',
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

test('branch user: every touched screen loads without an auth/null error', async ({ page }) => {
  test.setTimeout(180_000); // 8 screens + login exceeds the default 60s budget
  await uiLoginAs(page, BRANCH_USER.email, BRANCH_USER.password);

  const failures: string[] = [];
  for (const screen of SCREENS) {
    await page.goto(`${FRONTEND}${screen.path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800); // let the GraphQL fetch resolve
    const body = (await page.locator('body').innerText().catch(() => '')) || '';
    const hit = ERROR_PATTERNS.find((p) => body.includes(p));
    console.log(`${hit ? '❌' : '✅'} ${screen.name} (${screen.path})${hit ? ` → "${hit}"` : ''}`);
    if (hit) failures.push(`${screen.name} (${screen.path}): "${hit}"`);
  }

  expect(failures, `Screens still erroring:\n${failures.join('\n')}`).toEqual([]);
});
