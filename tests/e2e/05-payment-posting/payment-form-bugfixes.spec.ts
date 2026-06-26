/**
 * Payment-Posting "Other Payment" form — behaviour locked in by Heidi's rule
 * (2026-06-26): a payment is recorded in EXACTLY ONE of Collection /
 * Advanced Payment / Payment UA/SP — never two at once. Booking the same money
 * in two boxes is what understated the renewal Outstanding Balances
 * (e.g. FB BAL-00000947 / SAUCELO: 3,430 vs the true 3,570).
 *
 * What this spec proves:
 *   - Bank Charges is still the first input in both forms (legacy bug #3).
 *   - Interest is 0.00 (never NaN) on a fully-paid row (legacy bug #1).
 *   - ONE-BOX LOCK: filling one of the three payment boxes disables + zeroes the
 *     other two; clearing it re-enables them.
 *   - Interest auto-computes from WHICHEVER box is used — including an
 *     advance-only entry (Collection 0 + Advanced Payment / Payment UA/SP) — so
 *     operators never need a fake Collection just to make interest appear.
 *   - The Interest field is manually editable and sits at the bottom.
 *   - A value entered in a payment box is NOT wiped after 1s (legacy bug #2).
 *
 * Most tests are READ-ONLY (open form, type, observe — no Save). The single
 * Phase-B test Saves to the DB and then restores the schedule.
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
      .filter((e) => !e.readOnly && !e.disabled && e.type !== 'hidden')
      .map((e) => e.id)
  );
}

/** Open the Other Payment form on the first unpaid row and return the monthly amortization. */
async function openOtherOnUnpaid(page: Page): Promise<number> {
  const unpaidRow = await firstUnpaidRow(page);
  expect(unpaidRow, 'need at least one unpaid row').not.toBeNull();
  const monthly = parseFloat((await rowAmortization(unpaidRow!)).replace(/,/g, ''));
  await clickOther(unpaidRow!);
  await page.waitForSelector('h3:has-text("Other Payment")', { timeout: 5000 });
  await page.waitForTimeout(500);
  return monthly;
}

test.describe('Other Payment form — one-box rule + editable interest', () => {
  test.beforeEach(async ({ page }) => {
    await loginToApp(page);
  });

  test('Bug #3a: Bank Charges is the first input in Other Payments form', async ({ page }) => {
    await openTargetLoan(page);
    await openOtherOnUnpaid(page);

    const form = page.locator('form').filter({ has: page.locator('h3:has-text("Other Payment")') });
    const ids = await getEditableInputIdsInOrder(form);
    console.log(`   Editable input order: ${ids.join(' → ')}`);

    expect(ids[0], 'first editable input must be bank_charge').toBe('bank_charge');
    expect(ids[1], 'second editable input must be collection').toBe('collection');
    // Interest (id=udi) is now editable and lives at the BOTTOM, just before the date.
    expect(ids).toContain('udi');
    expect(ids.indexOf('udi')).toBeGreaterThan(ids.indexOf('commission_fee'));
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

    const interestVal = await inputValue(page, 'udi');
    const refundVal = await inputValue(page, 'ap_refund');
    console.log(`   Interest="${interestVal}"  AP Refund="${refundVal}"`);

    expect(interestVal, 'interest must never show NaN').not.toMatch(/NaN/i);
    expect(parseFloat(interestVal)).not.toBeNaN();
    expect(parseFloat(interestVal)).toBe(0);

    expect(refundVal).not.toMatch(/NaN/i);
    expect(parseFloat(refundVal)).not.toBeNaN();
  });

  test('One-box: typing Collection disables Advanced Payment and Payment UA/SP', async ({ page }) => {
    await openTargetLoan(page);
    const monthly = await openOtherOnUnpaid(page);

    // Both alternative boxes start enabled.
    expect(await page.locator('input#advanced_payment').isDisabled()).toBe(false);
    expect(await page.locator('input#payment_ua_sp').isDisabled()).toBe(false);

    await page.locator('input#collection').fill(monthly.toFixed(2));
    await page.waitForTimeout(400);

    // Now they must be locked and read 0.00.
    expect(await page.locator('input#advanced_payment').isDisabled(), 'advanced_payment locks').toBe(true);
    expect(await page.locator('input#payment_ua_sp').isDisabled(), 'payment_ua_sp locks').toBe(true);
    expect(await inputValue(page, 'advanced_payment')).toBe('0.00');
    expect(await inputValue(page, 'payment_ua_sp')).toBe('0.00');

    // Clearing Collection re-enables the other two.
    await page.locator('input#collection').fill('');
    await page.waitForTimeout(400);
    expect(await page.locator('input#advanced_payment').isDisabled(), 'advanced_payment re-enables').toBe(false);
    expect(await page.locator('input#payment_ua_sp').isDisabled(), 'payment_ua_sp re-enables').toBe(false);
  });

  test('One-box: Advanced Payment alone (Collection 0) locks the others and still computes interest', async ({ page }) => {
    await openTargetLoan(page);
    const monthly = await openOtherOnUnpaid(page);
    expect(monthly).toBeGreaterThan(0);

    // Genuine advance: enter Advanced Payment ONLY, never touch Collection.
    const advanceValue = (monthly * 3).toFixed(2);
    await page.locator('input#advanced_payment').fill(advanceValue);
    await page.waitForTimeout(400);

    // Collection + Payment UA/SP lock; Collection stays 0 (no fake cash needed).
    expect(await page.locator('input#collection').isDisabled(), 'collection locks').toBe(true);
    expect(await page.locator('input#payment_ua_sp').isDisabled(), 'payment_ua_sp locks').toBe(true);
    expect(await inputValue(page, 'collection')).toBe('0.00');

    // The legacy 1-second wipe must NOT fire — the value survives.
    await page.waitForTimeout(1500);
    const advAfter = await inputNumber(page, 'advanced_payment');
    expect(advAfter, 'advanced payment not wiped after 1.5s').toBeCloseTo(parseFloat(advanceValue), 1);

    // Interest is computed from the advance even though Collection is 0 (Heidi's requirement).
    const interest = await inputNumber(page, 'udi');
    console.log(`   advance=${advanceValue}, collection=0 -> interest=${interest}`);
    expect(interest).not.toBeNaN();
    expect(interest).toBeGreaterThan(0);
  });

  test('One-box: Payment UA/SP alone (Collection 0) locks the others and still computes interest', async ({ page }) => {
    await openTargetLoan(page);
    const monthly = await openOtherOnUnpaid(page);
    expect(monthly).toBeGreaterThan(0);

    const big = (monthly * 2).toFixed(2);
    await page.locator('input#payment_ua_sp').fill(big);
    await page.waitForTimeout(400);

    expect(await page.locator('input#collection').isDisabled(), 'collection locks').toBe(true);
    expect(await page.locator('input#advanced_payment').isDisabled(), 'advanced_payment locks').toBe(true);

    // Value survives the legacy wipe window.
    await page.waitForTimeout(1500);
    expect(await inputNumber(page, 'payment_ua_sp')).toBeCloseTo(parseFloat(big), 1);

    const interest = await inputNumber(page, 'udi');
    console.log(`   payment_ua_sp=${big}, collection=0 -> interest=${interest}`);
    expect(interest).not.toBeNaN();
    expect(interest).toBeGreaterThan(0);
  });

  test('Interest is editable: auto-fills from the payment box, then can be typed over', async ({ page }) => {
    await openTargetLoan(page);
    const monthly = await openOtherOnUnpaid(page);

    // Enter Collection -> interest auto-fills.
    await page.locator('input#collection').fill(monthly.toFixed(2));
    await page.waitForTimeout(400);
    const auto = await inputNumber(page, 'udi');
    expect(auto, 'interest auto-fills from Collection').toBeGreaterThan(0);

    // Interest field is NOT read-only and accepts a manual value that sticks.
    expect(await page.locator('input#udi').isEditable()).toBe(true);
    await page.locator('input#udi').fill('123.45');
    await page.waitForTimeout(200);
    expect(await inputValue(page, 'udi')).toBe('123.45');
  });

  test('Interest from Collection is proportional to the cash applied', async ({ page }) => {
    await openTargetLoan(page);
    const monthly = await openOtherOnUnpaid(page);
    expect(monthly).toBeGreaterThan(0);

    await page.locator('input#bank_charge').fill('0');
    await page.locator('input#collection').fill(monthly.toFixed(2));
    await page.waitForTimeout(400);
    const interestFull = await inputNumber(page, 'udi');
    const advUntouched = await inputValue(page, 'advanced_payment');
    console.log(`   collection=${monthly} -> interest=${interestFull}, advanced="${advUntouched}"`);

    expect(interestFull).not.toBeNaN();
    expect(interestFull).toBeGreaterThan(0);
    // Advanced Payment was never typed and is locked at 0 (no duplicate seeded).
    expect(['', '0', '0.00']).toContain(advUntouched);

    // Halving the Collection roughly halves the interest (proportional to cash).
    await page.locator('input#collection').fill((monthly / 2).toFixed(2));
    await page.waitForTimeout(400);
    const interestHalf = await inputNumber(page, 'udi');
    console.log(`   collection=${(monthly / 2).toFixed(2)} -> interest=${interestHalf}`);
    expect(interestHalf).toBeCloseTo(interestFull / 2, 0);
  });

  test('Phase B: Save advance-only (Collection 0) → DB persists Advanced Payment → cleanup restores schedule', async ({ page }) => {
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

      // Genuine advance: pay 3 months ahead as Advanced Payment ONLY (Collection 0).
      const today = new Date().toISOString().slice(0, 10);
      await page.locator('input#bank_charge').fill('0');
      await page.locator('input#advanced_payment').fill('11130');
      await page.locator('input#collection_date').fill(today);

      // Collection must be locked at 0 by the one-box rule.
      expect(await page.locator('input#collection').isDisabled()).toBe(true);

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
      console.log(`   DB rows — Collection=${collectionPaid} Advanced=${advancedPaid}`);

      // The Advanced Payment row must exist with the exact amount typed.
      expect(advancedPaid, 'Advanced Payment row must be persisted with the typed amount').not.toBeNull();
      expect(parseFloat(advancedPaid!)).toBeCloseTo(11130, 2);

      // No Collection cash was entered, so there must be no positive Collection row
      // (one-box rule: the same money is never booked in two places).
      if (collectionPaid !== null) {
        expect(parseFloat(collectionPaid)).toBe(0);
      }
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
});
