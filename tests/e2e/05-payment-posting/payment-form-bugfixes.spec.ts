/**
 * Other Payment form — REAL FIX (2026-06-26): Advanced Payment / Payment UA/SP are cash (Heidi),
 * so they must (a) SETTLE the schedule's due, (b) POST to the General Ledger, and (c) still show
 * on the SOA in their OWN columns (Advanced Payment / Payment UA/SP), not under Collection.
 *
 * Implementation: new such rows are flagged (payment_settles=1) and kept with their description.
 * The payment screen + SOA running balance + GL count flagged markers; the SOA display columns
 * are keyed by description, so they still show separately. Old rows (flag 0) are untouched.
 *
 * For EACH of Collection / Advanced Payment / Payment UA/SP this suite proves:
 *   - remaining amortization -> 0.00 (settles),
 *   - >=1 GL entry (posts to the ledger),
 *   - the SOA running balance drops by the amount (settles in the statement), and
 *   - the SOA shows the amount in the correct column (Collection vs Advanced Payment vs Payment UA/SP).
 * Plus: one-box lock, interest auto-fill/editable/not-clobbered, empty-save blocked.
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
  soaView,
  AccessibleLoan,
} from '../../helpers/phase-b-helpers';

const ADMIN_BRANCH_SUB = '1';

let loan: AccessibleLoan | null = null;

test.describe('Other Payment — all three boxes settle + book + show on the SOA', () => {
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

  /**
   * Pay the full amortization via one box, then assert it (1) settled the due, (2) posted to the
   * GL, (3) dropped the SOA running balance, and (4) shows in the expected SOA column.
   */
  async function payAndAssert(
    page: Page,
    boxId: 'collection' | 'advanced_payment' | 'payment_ua_sp',
    soaColumn: 'collection' | 'advancePayment' | 'paymentUaSp',
  ) {
    const sched = loan!.scheduleId;
    const amort = parseFloat(loan!.amort);
    expect(countActivePayments(sched), 'schedule starts clean').toBe(0);
    const balBefore = soaView(sched).finalBalance; // clean loan -> full debit
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
      const gl = glEntryCount(sched);
      const soa = soaView(sched);
      console.log(`   [${boxId}] remaining=${remaining} gl=${gl} soa.collection=${soa.collection} soa.adv=${soa.advancePayment} soa.uasp=${soa.paymentUaSp} balΔ=${(balBefore - soa.finalBalance).toFixed(2)}`);

      expect(remaining, `${boxId}: Due Date settled to 0`).toBe('0.00');
      expect(gl, `${boxId}: posted to the General Ledger`).toBeGreaterThanOrEqual(1);
      expect(balBefore - soa.finalBalance, `${boxId}: SOA running balance dropped by the payment`).toBeCloseTo(amort, 2);
      expect(soa[soaColumn], `${boxId}: shows in the SOA ${soaColumn} column`).toBeCloseTo(amort, 2);

      // Marker boxes keep their identity (NOT folded into Collection) so the SOA shows them separately.
      if (boxId === 'advanced_payment') {
        expect(parseFloat(paymentAmount(sched, 'Advanced Payment')!)).toBeCloseTo(amort, 2);
        expect(soa.collection, 'advance does NOT show under Collection').toBe(0);
      }
      if (boxId === 'payment_ua_sp') {
        expect(parseFloat(paymentAmount(sched, 'Payment UA/SP')!)).toBeCloseTo(amort, 2);
        expect(soa.collection, 'UA/SP does NOT show under Collection').toBe(0);
      }
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

  test('Collection: settles + books + shows under Collection on the SOA', async ({ page }) => {
    await payAndAssert(page, 'collection', 'collection');
  });

  test('Advanced Payment: settles + books + shows under Advanced Payment on the SOA', async ({ page }) => {
    await payAndAssert(page, 'advanced_payment', 'advancePayment');
  });

  test('Payment UA/SP: settles + books + shows under Payment UA/SP on the SOA', async ({ page }) => {
    await payAndAssert(page, 'payment_ua_sp', 'paymentUaSp');
  });
});
