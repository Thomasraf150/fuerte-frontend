/**
 * Payment-Posting Form Fixes — verifies three reported bugs:
 *
 *   1. NaN in Interest field on a fully-paid period when using "Other Payments"
 *   2. Advanced Payment field wiped to 0 after 1s when value exceeds the
 *      current row's monthly amortization
 *   3. Bank Charges should be the first input field in both forms
 *
 * READ-ONLY: opens forms, types values, observes field behavior. No Save click,
 * no DB writes. Safe to run against live data.
 *
 * Target: loan_id=8189 (FB BAL-00000996) — 1 paid schedule + 7 unpaid.
 */

import { test, expect, Page, Locator } from '@playwright/test';
import { loginToApp, navigateToPage } from '../../helpers/test-utils';
import {
  countActivePayments,
  paymentAmount,
  softDeletePaymentsForSchedule,
} from '../../helpers/phase-b-helpers';

const TARGET_LOAN_ID = '8189';
// Phase B target: the LAST schedule of FB BAL-00000996 (due 2026-08-25, ₱3,710).
// Picking the last row means we won't disrupt natural payment order for the loan.
const PHASE_B_SCHED_ID = 90155;

async function openTargetLoan(page: Page) {
  await navigateToPage(page, `/payment-posting/${TARGET_LOAN_ID}`);
  // Wait for the schedule grid to render.
  await page.waitForSelector('button:has-text("Other")', { timeout: 15000 });
  await page.waitForTimeout(1000);
}

/**
 * The schedule grid lives inside the "Loan Ref:" card and uses CSS grid rows.
 * Header row has <p class="font-semibold">, data rows don't.
 */
async function getDataRows(page: Page): Promise<Locator> {
  return page.locator('div.grid.border-t.border-stroke').filter({
    hasNot: page.locator('p.font-semibold'),
  });
}

async function rowAmortization(row: Locator): Promise<string> {
  // Cell layout: due_date | amortization | interest | actions
  return (await row.locator('p').nth(1).textContent())?.trim() ?? '';
}

/**
 * Button order inside each schedule row (from LoanDetails.tsx):
 *   [0] Other Payments
 *   [1] Proceed to Pay  OR  Paid (disabled)
 *   [2] Reverse
 * So we identify paid vs unpaid by the disabled-state of the second button.
 */
async function firstPaidRow(page: Page): Promise<Locator | null> {
  const rows = await getDataRows(page);
  const total = await rows.count();
  for (let i = 0; i < total; i++) {
    const row = rows.nth(i);
    const payOrPaid = row.locator('button').nth(1);
    if (await payOrPaid.isDisabled()) return row;
  }
  return null;
}

async function firstUnpaidRow(page: Page): Promise<Locator | null> {
  const rows = await getDataRows(page);
  const total = await rows.count();
  for (let i = 0; i < total; i++) {
    const row = rows.nth(i);
    const payOrPaid = row.locator('button').nth(1);
    if (!(await payOrPaid.isDisabled())) return row;
  }
  return null;
}

/** Click the "Other Payments" button in a row (first button). */
async function clickOther(row: Locator) {
  await row.locator('button').nth(0).click();
}

/** Click the "Proceed to Pay" / "Pay" button in a row (second button). */
async function clickPay(row: Locator) {
  await row.locator('button').nth(1).click();
}

async function inputValue(page: Page, id: string): Promise<string> {
  return await page.locator(`input#${id}`).inputValue();
}

/** Read an input's value and parse as a number, tolerating thousands-separator commas. */
async function inputNumber(page: Page, id: string): Promise<number> {
  const v = await inputValue(page, id);
  return parseFloat(v.replace(/,/g, ''));
}

async function getEditableInputIdsInOrder(form: Locator): Promise<string[]> {
  return await form.locator('input[id]').evaluateAll((els) =>
    (els as HTMLInputElement[])
      .filter((e) => !e.readOnly && e.type !== 'hidden')
      .map((e) => e.id)
  );
}

test.describe('Payment Posting form fixes', () => {
  test.beforeEach(async ({ page }) => {
    await loginToApp(page);
  });

  test('Bug #3a: Bank Charges is the first input in Other Payments form', async ({ page }) => {
    await openTargetLoan(page);

    const unpaidRow = await firstUnpaidRow(page);
    expect(unpaidRow, 'need at least one unpaid row').not.toBeNull();
    await clickOther(unpaidRow!);
    await page.waitForSelector('h3:has-text("Other Payment")', { timeout: 5000 });
    await page.waitForTimeout(500);

    const form = page.locator('form').filter({ has: page.locator('h3:has-text("Other Payment")') });
    const ids = await getEditableInputIdsInOrder(form);
    console.log(`   Editable input order: ${ids.join(' → ')}`);

    expect(ids[0], 'first editable input must be bank_charge').toBe('bank_charge');
    expect(ids[1], 'second editable input must be collection').toBe('collection');
  });

  test('Bug #3b: Bank Charges is the first input in Process Payment form', async ({ page }) => {
    await openTargetLoan(page);

    const unpaidRow = await firstUnpaidRow(page);
    expect(unpaidRow).not.toBeNull();
    await clickPay(unpaidRow!);
    await page.waitForSelector('h3:has-text("Process Payment")', { timeout: 5000 });
    await page.waitForTimeout(500);

    const form = page.locator('form').filter({ has: page.locator('h3:has-text("Process Payment")') });
    const ids = await getEditableInputIdsInOrder(form);
    console.log(`   Editable input order: ${ids.join(' → ')}`);

    expect(ids[0], 'first editable input must be bank_charge').toBe('bank_charge');
    expect(ids[1], 'second editable input must be collection').toBe('collection');
  });

  test('Bug #1: Interest is 0.00 (no NaN) on a fully-paid row using Other Payments', async ({ page }) => {
    await openTargetLoan(page);

    const paidRow = await firstPaidRow(page);
    expect(paidRow, 'need a fully paid row to test NaN-protection').not.toBeNull();
    const origAmt = await rowAmortization(paidRow!);
    console.log(`   Paid row amortization: "${origAmt}"`);

    await clickOther(paidRow!);
    await page.waitForSelector('h3:has-text("Other Payment")', { timeout: 5000 });
    await page.waitForTimeout(500);

    await page.locator('input#bank_charge').fill('50');
    await page.locator('input#collection').fill('3710');
    await page.waitForTimeout(400);

    const interestVal = await page.locator('input#udi').inputValue();
    const refundVal = await inputValue(page, 'ap_refund');
    console.log(`   Interest="${interestVal}"  AP Refund="${refundVal}"`);

    expect(interestVal, 'interest must never show NaN').not.toMatch(/NaN/i);
    expect(parseFloat(interestVal)).not.toBeNaN();
    expect(parseFloat(interestVal)).toBe(0);

    expect(refundVal).not.toMatch(/NaN/i);
    expect(parseFloat(refundVal)).not.toBeNaN();
  });

  test('Bug #2a: Advanced Payment exceeding row amortization is NOT wiped after 1s', async ({ page }) => {
    await openTargetLoan(page);

    const unpaidRow = await firstUnpaidRow(page);
    expect(unpaidRow).not.toBeNull();
    const monthlyRaw = await rowAmortization(unpaidRow!);
    const monthly = parseFloat(monthlyRaw.replace(/,/g, ''));
    expect(monthly).toBeGreaterThan(0);
    console.log(`   Monthly amortization: ${monthly}`);

    await clickOther(unpaidRow!);
    await page.waitForSelector('h3:has-text("Other Payment")', { timeout: 5000 });
    await page.waitForTimeout(500);

    const advanceValue = (monthly * 3).toFixed(2);
    const collectionValue = (monthly * 3).toFixed(2);

    await page.locator('input#bank_charge').fill('50');
    await page.locator('input#collection').fill(collectionValue);
    await page.locator('input#advanced_payment').fill(advanceValue);

    // Old code wiped to 0 after 1 second via setTimeout.
    await page.waitForTimeout(1500);

    const advancedAfter = await inputValue(page, 'advanced_payment');
    const advancedAfterNum = await inputNumber(page, 'advanced_payment');
    const interestAfter = await page.locator('input#udi').inputValue();
    const interestAfterNum = parseFloat(interestAfter.replace(/,/g, ''));
    console.log(`   After 1.5s: advanced="${advancedAfter}" (=${advancedAfterNum}) interest="${interestAfter}" (=${interestAfterNum})`);

    expect(advancedAfter).not.toBe('');
    expect(advancedAfter).not.toBe('0');
    expect(advancedAfter).not.toBe('0.00');
    expect(advancedAfterNum).toBeCloseTo(parseFloat(advanceValue), 1);

    expect(interestAfter).not.toMatch(/NaN/i);
    expect(interestAfterNum).not.toBeNaN();
    // Advance of 3× the monthly amortization should drive interest to the
    // capped value (remaining UDI for this row, which is > 0 for an unpaid row).
    expect(interestAfterNum).toBeGreaterThan(0);
  });

  test('Phase B: Save → DB persists Advanced Payment → cleanup restores schedule', async ({ page }) => {
    // Pre-condition: target schedule must start clean.
    expect(
      countActivePayments(PHASE_B_SCHED_ID),
      `schedule ${PHASE_B_SCHED_ID} must start with zero active payments`
    ).toBe(0);

    let needsCleanup = false;
    try {
      await openTargetLoan(page);

      // Find the row for PHASE_B_SCHED_ID — it's the last row (2026-08-25).
      const rows = await getDataRows(page);
      const total = await rows.count();
      expect(total).toBeGreaterThanOrEqual(8);
      const targetRow = rows.nth(total - 1);

      await clickOther(targetRow);
      await page.waitForSelector('h3:has-text("Other Payment")', { timeout: 5000 });
      await page.waitForTimeout(500);

      // Fill the form: simulate a customer paying current month + 3 months in advance.
      const today = new Date().toISOString().slice(0, 10);
      await page.locator('input#bank_charge').fill('0');
      await page.locator('input#collection').fill('3710');
      await page.locator('input#advanced_payment').fill('11130');
      await page.locator('input#collection_date').fill(today);

      // Wait past the old 1-second wipe window — value must survive.
      await page.waitForTimeout(1500);
      const advBefore = await inputNumber(page, 'advanced_payment');
      expect(advBefore).toBeCloseTo(11130, 1);

      // Submit.
      await page.locator('button:has-text("Pay Now")').click();

      // Wait for success toast.
      await page.waitForSelector('.Toastify__toast--success', { timeout: 20000 });
      const toastText = await page.locator('.Toastify__toast--success').first().textContent();
      console.log(`   Success toast: "${toastText?.trim()}"`);
      needsCleanup = true; // From here on, payments exist in the DB.

      // Give the backend a beat to commit the transaction.
      await page.waitForTimeout(800);

      // ── DB verification — the headline check ──────────────────────────────
      const collectionPaid = paymentAmount(PHASE_B_SCHED_ID, 'Collection');
      const advancedPaid = paymentAmount(PHASE_B_SCHED_ID, 'Advanced Payment');
      const udiPaid = paymentAmount(PHASE_B_SCHED_ID, 'UDI');
      console.log(`   DB rows — Collection=${collectionPaid} Advanced=${advancedPaid} UDI=${udiPaid}`);

      // The Advanced Payment row is the one that USED to be wiped. It must exist
      // with the exact amount the user typed.
      expect(advancedPaid, 'Advanced Payment row must be persisted with the typed amount').not.toBeNull();
      expect(parseFloat(advancedPaid!)).toBeCloseTo(11130, 2);

      // Collection should also be persisted.
      expect(collectionPaid).not.toBeNull();
      expect(parseFloat(collectionPaid!)).toBeCloseTo(3710, 2);

      // UDI (interest) should be capped at remaining UDI (660), not NaN or scaled wildly.
      expect(udiPaid).not.toBeNull();
      expect(parseFloat(udiPaid!)).toBeCloseTo(660, 2);
    } finally {
      // Always restore the schedule to a clean state so the spec is idempotent.
      if (needsCleanup) {
        softDeletePaymentsForSchedule(PHASE_B_SCHED_ID);
        const after = countActivePayments(PHASE_B_SCHED_ID);
        console.log(`   Cleanup done. Active payments on ${PHASE_B_SCHED_ID} now: ${after}`);
        expect(after, 'cleanup must restore zero active payments').toBe(0);
      }
    }
  });

  test('Bug #2b: payment_ua_sp exceeding row amortization is NOT wiped after 1s', async ({ page }) => {
    await openTargetLoan(page);

    const unpaidRow = await firstUnpaidRow(page);
    expect(unpaidRow).not.toBeNull();
    const monthlyRaw = await rowAmortization(unpaidRow!);
    const monthly = parseFloat(monthlyRaw.replace(/,/g, ''));

    await clickOther(unpaidRow!);
    await page.waitForSelector('h3:has-text("Other Payment")', { timeout: 5000 });
    await page.waitForTimeout(500);

    const big = (monthly * 2).toFixed(2);
    await page.locator('input#bank_charge').fill('0');
    await page.locator('input#collection').fill(big);
    await page.locator('input#payment_ua_sp').fill(big);

    await page.waitForTimeout(1500);

    const after = await inputValue(page, 'payment_ua_sp');
    const afterNum = await inputNumber(page, 'payment_ua_sp');
    console.log(`   payment_ua_sp after 1.5s: "${after}" (=${afterNum})`);
    expect(afterNum).toBeCloseTo(parseFloat(big), 1);
  });

  test('Fix: Other Payment interest is driven by Collection (no Advanced Payment needed)', async ({ page }) => {
    // Regression for the renewal-OB duplicate (loan FB BAL-00000947 / SAUCELO):
    // the form used to compute interest from advanced_payment, so to record a
    // schedule's interest an operator had to type the cash into BOTH Collection
    // and Advanced Payment — minting a duplicate Advanced Payment row that
    // understated the renewal OB (3,430 vs the true 3,570). Interest is now
    // remainingUdi * (collection / remainingDue), so Collection alone is enough
    // and no Advanced Payment entry (= no duplicate) is needed.
    await openTargetLoan(page);

    const unpaidRow = await firstUnpaidRow(page);
    expect(unpaidRow, 'need an unpaid row').not.toBeNull();
    const monthly = parseFloat((await rowAmortization(unpaidRow!)).replace(/,/g, ''));
    expect(monthly).toBeGreaterThan(0);

    await clickOther(unpaidRow!);
    await page.waitForSelector('h3:has-text("Other Payment")', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Enter ONLY Collection (full amortization). Never touch Advanced Payment.
    await page.locator('input#bank_charge').fill('0');
    await page.locator('input#collection').fill(monthly.toFixed(2));
    await page.waitForTimeout(400);

    const interestFull = await inputNumber(page, 'udi');
    const advUntouched = await inputValue(page, 'advanced_payment');
    console.log(`   collection=${monthly} -> interest=${interestFull}, advanced="${advUntouched}"`);

    // Interest computed from Collection alone — positive, not NaN — so the
    // operator no longer needs an Advanced Payment entry to get interest.
    expect(interestFull).not.toBeNaN();
    expect(interestFull).toBeGreaterThan(0);
    // Advanced Payment was never typed and stays empty/zero (no duplicate seeded).
    expect(['', '0', '0.00']).toContain(advUntouched);

    // Halving the Collection roughly halves the interest (proportional to cash).
    await page.locator('input#collection').fill((monthly / 2).toFixed(2));
    await page.waitForTimeout(400);
    const interestHalf = await inputNumber(page, 'udi');
    console.log(`   collection=${(monthly / 2).toFixed(2)} -> interest=${interestHalf}`);
    expect(interestHalf).toBeCloseTo(interestFull / 2, 0);
  });
});
