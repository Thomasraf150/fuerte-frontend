/**
 * Other Payment form — REAL FIX (2026-06-26): Advanced Payment / Payment UA/SP are cash
 * (Heidi), so a payment via ANY of the three boxes must settle the due AND post to the GL.
 *
 * The backend folds Advanced Payment / Payment UA/SP into Collection at posting time, so the
 * payment runs through the proven Collection path (settles + books). The three boxes stay
 * mutually exclusive (one-box lock) so the same money can never be booked twice.
 *
 * This suite proves, for EACH of Collection / Advanced Payment / Payment UA/SP:
 *   - the payment SETTLES the schedule (remaining amortization -> 0.00), and
 *   - it POSTS to the General Ledger (>=1 acctg entry), and
 *   - it is recorded as a Collection (the fold), with NO leftover marker row.
 * Plus: one-box lock works, interest auto-fills + editable + not clobbered, empty save blocked.
 *
 * Auto-discovers a fully-clean, admin-accessible loan (branch_sub 1) and self-cleans (idempotent).
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

const ADMIN_BRANCH_SUB = '1';

let loan: AccessibleLoan | null = null;

test.describe('Other Payment form — real fix (all three boxes settle + book)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => { loan = findAccessibleLoan(ADMIN_BRANCH_SUB); });

  test.beforeEach(async ({ page }) => {
    test.skip(!loan, 'no fully-clean open loan in branch_sub 1 to test against');
    await loginToApp(page);
  });

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
    expect(target, `schedule row for due ${loan!.dueDate}`).not.toBeNull();
    await target!.locator('button').nth(0).click();
    await page.waitForSelector('h3:has-text("Other Payment")', { timeout: 5000 });
    await page.waitForTimeout(500);
  }

  const val = async (page: Page, id: string) => (await page.locator(`input#${id}`).inputValue());
  const numVal = async (page: Page, id: string) => parseFloat((await val(page, id)).replace(/,/g, ''));

  /** Pay the full amortization via one box, then assert it settled + booked + folded to Collection. */
  async function payViaBoxAndAssert(page: Page, boxId: 'collection' | 'advanced_payment' | 'payment_ua_sp') {
    const sched = loan!.scheduleId;
    const amort = parseFloat(loan!.amort);
    expect(countActivePayments(sched), 'schedule starts clean').toBe(0);
    let saved = false;
    try {
      await openForm(page);
      await page.locator('input#bank_charge').fill('0');
      await page.locator(`input#${boxId}`).fill(amort.toFixed(2));
      await page.locator('input#collection_date').fill(new Date().toISOString().slice(0, 10));
      await page.waitForTimeout(300);
      await page.locator('button:has-text("Pay Now")').click();
      await page.waitForSelector('.Toastify__toast--success', { timeout: 20000 });
      saved = true;
      await page.waitForTimeout(900);

      const remaining = remainingAmort(sched);
      const collection = paymentAmount(sched, 'Collection');
      const advanced = paymentAmount(sched, 'Advanced Payment');
      const ua = paymentAmount(sched, 'Payment UA/SP');
      const gl = glEntryCount(sched);
      console.log(`   [${boxId}] remaining=${remaining} collection=${collection} adv=${advanced} uasp=${ua} gl=${gl}`);

      expect(remaining, `${boxId}: Due Date settled to 0`).toBe('0.00');
      expect(gl, `${boxId}: posted to the General Ledger`).toBeGreaterThanOrEqual(1);
      // Folded to Collection: the cash is a Collection row of the full amount, no marker row left.
      expect(collection, `${boxId}: recorded as a Collection`).not.toBeNull();
      expect(parseFloat(collection!)).toBeCloseTo(amort, 2);
      expect(advanced, `${boxId}: no Advanced Payment marker row`).toBeNull();
      expect(ua, `${boxId}: no Payment UA/SP marker row`).toBeNull();
    } finally {
      if (saved) {
        cleanupLoan(loan!.loanId);
        expect(countActivePayments(sched), 'cleanup restores clean schedule').toBe(0);
      }
    }
  }

  test('One-box lock: typing Collection disables Advanced Payment + Payment UA/SP; clearing re-enables', async ({ page }) => {
    await openForm(page);
    expect(await page.locator('input#advanced_payment').isDisabled()).toBe(false);
    expect(await page.locator('input#payment_ua_sp').isDisabled()).toBe(false);
    await page.locator('input#collection').fill('100');
    await page.waitForTimeout(400);
    expect(await page.locator('input#advanced_payment').isDisabled(), 'advanced locks').toBe(true);
    expect(await page.locator('input#payment_ua_sp').isDisabled(), 'ua_sp locks').toBe(true);
    await page.locator('input#collection').fill('');
    await page.waitForTimeout(400);
    expect(await page.locator('input#advanced_payment').isDisabled(), 'advanced re-enables').toBe(false);
  });

  test('Bank Charges is first; Interest sits at the bottom', async ({ page }) => {
    await openForm(page);
    const form = page.locator('form').filter({ has: page.locator('h3:has-text("Other Payment")') });
    const ids = await form.locator('input[id]').evaluateAll((els) =>
      (els as HTMLInputElement[]).filter((e) => !e.readOnly && !e.disabled && e.type !== 'hidden').map((e) => e.id));
    console.log(`   editable order: ${ids.join(' → ')}`);
    expect(ids[0]).toBe('bank_charge');
    expect(ids[1]).toBe('collection');
    expect(ids.indexOf('udi')).toBeGreaterThan(ids.indexOf('commission_fee'));
  });

  test('Interest auto-fills, is editable, and survives a later bank-charge edit', async ({ page }) => {
    await openForm(page);
    await page.locator('input#bank_charge').fill('0');
    await page.locator('input#collection').fill(parseFloat(loan!.amort).toFixed(2));
    await page.waitForTimeout(400);
    expect(await numVal(page, 'udi')).toBeGreaterThan(0);
    expect(await page.locator('input#udi').isEditable()).toBe(true);
    await page.locator('input#udi').fill('123.45');
    await page.waitForTimeout(150);
    expect(await val(page, 'udi')).toBe('123.45');
    await page.locator('input#bank_charge').fill('25');
    await page.waitForTimeout(300);
    expect(await val(page, 'udi'), 'manual interest preserved').toBe('123.45');
  });

  test('Empty save (no payment) is blocked', async ({ page }) => {
    await openForm(page);
    await page.locator('input#collection_date').fill(new Date().toISOString().slice(0, 10));
    await page.locator('button:has-text("Pay Now")').click();
    await expect(page.getByText('Enter the payment in Collection, Advanced Payment, or Payment UA/SP.', { exact: true }))
      .toBeVisible({ timeout: 5000 });
    expect(countActivePayments(loan!.scheduleId)).toBe(0);
  });

  test('Collection payment settles + books', async ({ page }) => {
    await payViaBoxAndAssert(page, 'collection');
  });

  test('Advanced Payment (Collection 0) settles + books — recorded as Collection', async ({ page }) => {
    await payViaBoxAndAssert(page, 'advanced_payment');
  });

  test('Payment UA/SP (Collection 0) settles + books — recorded as Collection', async ({ page }) => {
    await payViaBoxAndAssert(page, 'payment_ua_sp');
  });
});
