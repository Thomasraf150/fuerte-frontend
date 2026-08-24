/**
 * Regression suite for thousand separators.
 *
 * Reported on Notes Receivable: "the thousands don't have a comma to help
 * reading". The cause was money rendered through a bare `.toFixed(2)` instead
 * of one of the comma-aware helpers, so 27040.00 printed as a wall of digits.
 *
 * The invariant asserted here is deliberately shaped as a NEGATIVE: no rendered
 * money-looking value may carry four or more leading digits without a
 * separator. Asserting "commas appear somewhere" would pass on a page whose
 * money happens to be under a thousand, and would miss the one unformatted
 * column among fifteen formatted ones.
 *
 * Input fields are excluded on purpose. Their values must stay comma-free —
 * the payment forms parse what they render, so a separator there is a data bug,
 * not a display improvement. innerText() reads text nodes only, so an <input
 * value> never reaches these assertions.
 */
import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const AUTH = fs.readFileSync(
  path.resolve(__dirname, '../../../../fuerte-backend/dev/_scratch/auth_owner.json'),
  'utf8',
);

/**
 * A money value printed without separators: four or more digits, a decimal
 * point, exactly two decimals.
 *
 * The leading (?<![\d,.]) rejects the tail of an already-formatted number
 * (the "040.00" inside "27,040.00") and anything mid-decimal. The trailing
 * (?!\d) stops a longer-precision figure from matching its own prefix.
 */
const UNSEPARATED = /(?<![\d,.])\d{4,}\.\d{2}(?!\d)/g;

/** Money printed WITH separators — used only to prove a page had data at all. */
const SEPARATED = /\d{1,3}(?:,\d{3})+\.\d{2}/g;

const SCREENS: Array<{ path: string; name: string; settleMs: number }> = [
  { path: '/notes-receivable', name: 'Notes Receivable', settleMs: 25000 },
  { path: '/', name: 'Summary Ticket', settleMs: 20000 },
  { path: '/accounting/unadjusted-trial-balance', name: 'Unadjusted Trial Balance', settleMs: 18000 },
  { path: '/accounting/adjusted-trial-balance', name: 'Adjusted Trial Balance', settleMs: 18000 },
  { path: '/accounting/adjusting-entries', name: 'Adjusting Entries', settleMs: 18000 },
  { path: '/accounting/general-voucher', name: 'General Voucher', settleMs: 18000 },
  { path: '/accounting/general-journal', name: 'General Journal', settleMs: 18000 },
  { path: '/accounting/general-ledger', name: 'General Ledger', settleMs: 18000 },
  { path: '/accounting/coa', name: 'Chart of Accounts', settleMs: 18000 },
  { path: '/accounting/commission-schedule', name: 'Commission Schedule', settleMs: 18000 },
  { path: '/loan-products', name: 'Loan Products', settleMs: 18000 },
  { path: '/problem-accounts', name: 'Problem Accounts', settleMs: 18000 },
  { path: '/renewable-borrowers', name: 'Renewable Borrowers', settleMs: 18000 },
  { path: '/loans-list', name: 'Loans list', settleMs: 18000 },
  { path: '/borrowers', name: 'Borrowers list', settleMs: 18000 },
  { path: '/collection-list', name: 'Collection List', settleMs: 18000 },
  { path: '/payment-posting', name: 'Payment Posting', settleMs: 18000 },
  { path: '/statement-of-account', name: 'Statement of Account', settleMs: 18000 },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript((a) => {
    localStorage.setItem('authStore', a as string);
  }, AUTH);
  // Wide enough for Tailwind's xl breakpoint. The Notes Receivable per-month
  // grid is `hidden xl:table-cell`, and innerText() cannot see a display:none
  // cell — at the default 1280x720 those twelve money columns were invisible to
  // this suite, which is exactly how they stayed unformatted while every other
  // NR column got fixed. Any narrower and this file silently stops testing them.
  await page.setViewportSize({ width: 2200, height: 1200 });
});

async function bodyText(page: Page): Promise<string> {
  return (await page.locator('body').innerText().catch(() => '')) || '';
}

for (const screen of SCREENS) {
  test(`${screen.name}: no money rendered without separators`, async ({ page }) => {
    await page.goto(screen.path);
    await page.waitForTimeout(screen.settleMs);

    const text = await bodyText(page);
    expect(text.length, `${screen.name} rendered an empty page`).toBeGreaterThan(50);

    const offenders = Array.from(new Set(text.match(UNSEPARATED) || []));
    expect(
      offenders,
      `${screen.name} printed money without separators: ${offenders.slice(0, 10).join(', ')}`,
    ).toEqual([]);
  });
}

test('Notes Receivable actually renders separated money (guards a vacuous pass)', async ({
  page,
}) => {
  await page.goto('/notes-receivable');
  await page.waitForTimeout(25000);

  const found = (await bodyText(page)).match(SEPARATED) || [];
  expect(
    found.length,
    'no thousands-scale money on screen — the negative assertions above would pass vacuously',
  ).toBeGreaterThan(0);
});
