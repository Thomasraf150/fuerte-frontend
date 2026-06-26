/**
 * Other Payment form — STOPGAP behaviour (2026-06-26).
 *
 * Heidi confirmed Advanced Payment / Payment UA/SP are cash, so they MUST settle the due
 * and post to the GL like Collection. Today only Collection does that, so those two boxes
 * are temporarily DISABLED and all cash is recorded in Collection. This suite proves:
 *
 *   - Advanced Payment / Payment UA/SP inputs are disabled; Collection + Bank Charge usable.
 *   - Interest auto-fills from Collection (net of bank charge), is editable, and a hand-edit
 *     is NOT clobbered by a later bank-charge change.
 *   - An empty save (no Collection) is blocked.
 *   - A Collection payment ACTUALLY SETTLES the schedule (remaining → 0.00) AND posts to the
 *     General Ledger (>=1 acctg entry). This is the end-to-end check that was missing before.
 *
 * The suite auto-discovers a fully-clean, admin-accessible loan (branch_sub 1 / Marikina) and
 * cleans up everything it creates, so it is idempotent and safe to re-run on the live copy.
 */

import { test, expect, Page, Locator } from '@playwright/test';
import { loginToApp, navigateToPage } from '../../helpers/test-utils';
import {
  findAccessibleLoan,
  remainingAmort,
  glEntryCount,
  cleanupLoan,
  countActivePayments,
  paymentAmount,
  AccessibleLoan,
} from '../../helpers/phase-b-helpers';

const ADMIN_BRANCH_SUB = '1'; // admin@gmail.com (loginToApp) is branch_sub 1 (Marikina)

let loan: AccessibleLoan | null = null;

test.describe('Other Payment form — stopgap (cash via Collection)', () => {
  // These tests share one loan and write/clean the DB — run them serially.
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    loan = findAccessibleLoan(ADMIN_BRANCH_SUB);
  });

  test.beforeEach(async ({ page }) => {
    test.skip(!loan, 'no fully-clean open loan in branch_sub 1 to test against');
    await loginToApp(page);
  });

  /** Open the Other Payment form on the discovered clean schedule (matched by due date). */
  async function openForm(page: Page): Promise<void> {
    await navigateToPage(page, `/payment-posting/${loan!.loanId}`);
    await page.waitForSelector('button:has-text("Other")', { timeout: 15000 });
    await page.waitForTimeout(1000);
    const rows = page.locator('div.grid.border-t.border-stroke').filter({ hasNot: page.locator('p.font-semibold') });
    const total = await rows.count();
    let target: Locator | null = null;
    for (let i = 0; i < total; i++) {
      const due = (await rows.nth(i).locator('p').nth(0).textContent())?.trim()?.slice(0, 10);
      if (due === loan!.dueDate) { target = rows.nth(i); break; }
    }
    expect(target, `schedule row for due date ${loan!.dueDate}`).not.toBeNull();
    await target!.locator('button').nth(0).click(); // "Other Payments"
    await page.waitForSelector('h3:has-text("Other Payment")', { timeout: 5000 });
    await page.waitForTimeout(500);
  }

  const val = async (page: Page, id: string) => (await page.locator(`input#${id}`).inputValue());
  const numVal = async (page: Page, id: string) => parseFloat((await val(page, id)).replace(/,/g, ''));

  test('Advanced Payment + Payment UA/SP are disabled; Collection is usable', async ({ page }) => {
    await openForm(page);
    expect(await page.locator('input#advanced_payment').isDisabled(), 'advanced_payment disabled').toBe(true);
    expect(await page.locator('input#payment_ua_sp').isDisabled(), 'payment_ua_sp disabled').toBe(true);
    expect(await page.locator('input#collection').isDisabled(), 'collection usable').toBe(false);
    expect(await page.locator('input#bank_charge').isDisabled(), 'bank_charge usable').toBe(false);
  });

  test('Bank Charges is the first editable input; Interest sits at the bottom', async ({ page }) => {
    await openForm(page);
    const form = page.locator('form').filter({ has: page.locator('h3:has-text("Other Payment")') });
    const ids = await form.locator('input[id]').evaluateAll((els) =>
      (els as HTMLInputElement[]).filter((e) => !e.readOnly && !e.disabled && e.type !== 'hidden').map((e) => e.id));
    console.log(`   editable order: ${ids.join(' → ')}`);
    expect(ids[0]).toBe('bank_charge');
    expect(ids[1]).toBe('collection');
    expect(ids.indexOf('udi')).toBeGreaterThan(ids.indexOf('commission_fee')); // interest moved to bottom
  });

  test('Interest auto-fills from Collection, is editable, and survives a later bank-charge edit', async ({ page }) => {
    await openForm(page);
    const monthly = parseFloat(loan!.amort);
    await page.locator('input#bank_charge').fill('0');
    await page.locator('input#collection').fill(monthly.toFixed(2));
    await page.waitForTimeout(400);
    expect(await numVal(page, 'udi'), 'interest auto-fills').toBeGreaterThan(0);

    // editable + sticks
    expect(await page.locator('input#udi').isEditable()).toBe(true);
    await page.locator('input#udi').fill('123.45');
    await page.waitForTimeout(150);
    expect(await val(page, 'udi')).toBe('123.45');

    // a later bank-charge edit must NOT clobber the manual interest
    await page.locator('input#bank_charge').fill('25');
    await page.waitForTimeout(300);
    expect(await val(page, 'udi'), 'manual interest preserved').toBe('123.45');
  });

  test('Empty save (no Collection) is blocked', async ({ page }) => {
    await openForm(page);
    const today = new Date().toISOString().slice(0, 10);
    await page.locator('input#collection_date').fill(today);
    await page.locator('button:has-text("Pay Now")').click();
    await expect(page.getByText('Enter the cash payment in Collection.', { exact: true })).toBeVisible({ timeout: 5000 });
    expect(countActivePayments(loan!.scheduleId), 'nothing saved').toBe(0);
  });

  test('Collection payment SETTLES the schedule AND posts to the General Ledger', async ({ page }) => {
    const sched = loan!.scheduleId;
    const amort = parseFloat(loan!.amort);
    expect(countActivePayments(sched), 'schedule starts clean').toBe(0);

    let saved = false;
    try {
      await openForm(page);
      await page.locator('input#bank_charge').fill('0');
      await page.locator('input#collection').fill(amort.toFixed(2));
      const today = new Date().toISOString().slice(0, 10);
      await page.locator('input#collection_date').fill(today);
      await page.waitForTimeout(300);
      await page.locator('button:has-text("Pay Now")').click();
      await page.waitForSelector('.Toastify__toast--success', { timeout: 20000 });
      saved = true;
      await page.waitForTimeout(900); // let the transaction commit

      // ── the checks that were missing before ──────────────────────────────
      const remaining = remainingAmort(sched);
      const collected = paymentAmount(sched, 'Collection');
      const gl = glEntryCount(sched);
      console.log(`   remaining=${remaining}  collection=${collected}  glEntries=${gl}`);

      expect(remaining, 'Due Date must be settled to 0').toBe('0.00');
      expect(collected, 'Collection row persisted').not.toBeNull();
      expect(parseFloat(collected!)).toBeCloseTo(amort, 2);
      expect(gl, 'payment must post to the General Ledger').toBeGreaterThanOrEqual(1);
    } finally {
      if (saved) {
        cleanupLoan(loan!.loanId);
        expect(countActivePayments(sched), 'cleanup restores clean schedule').toBe(0);
      }
    }
  });
});
