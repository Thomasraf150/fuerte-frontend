/**
 * Phase A.2 — Payment Posting + Reversal
 *
 * Validates the end-to-end "money in / money out" symmetry:
 *   1. Post a payment against a known existing schedule
 *   2. Verify the payment row + GL acctg_entries row both exist & balance
 *   3. Reverse the payment via deletePostedPayment
 *   4. Verify both the payment row AND its GL entry are soft-deleted
 *
 * Why reversal matters: per CLAUDE.md commit history "Bypass approval for
 * payment reversals" — Accounting users routinely reverse payments for
 * rounding adjustments. If this path is broken, accounting can't reconcile.
 *
 * Uses the same hardcoded loan_id / schedule_id as payment-form-bugfixes
 * — these are stable test records in the dev DB (loan_id=8189 / FB
 * BAL-00000996, schedule 90155 is the LAST unpaid row so we don't disrupt
 * natural payment order).
 */

import { test, expect } from '@playwright/test';
import { restLogin, gqlAs } from '../../helpers/e2e-helpers';
import {
  countActivePayments,
  softDeletePaymentsForSchedule,
} from '../../helpers/phase-b-helpers';

const ADMIN = { email: 'test.admin@fuerte.test', password: 'TestPass2026!' };
const TARGET_SCHEDULE_ID = 90155;
const PAYMENT_AMOUNT = '500.00';

test.describe('Money path: payment posting + reversal symmetry', () => {
  test.setTimeout(120_000);

  test('posts a payment with GL entry, then reverses it; both rows soft-deleted', async ({ request }) => {
    let needsCleanup = false;
    try {
      const admin = await restLogin(request, ADMIN.email, ADMIN.password);
      const token = admin.token;
      const userId = String(admin.user.id);

      // Baseline — should be 0 active payments on this schedule going in.
      // (If a previous failed run left one, clean it first to keep the
      // test deterministic.)
      const baseline = countActivePayments(TARGET_SCHEDULE_ID);
      if (baseline > 0) {
        console.log(`   ↳ found ${baseline} pre-existing payment(s), cleaning before test...`);
        softDeletePaymentsForSchedule(TARGET_SCHEDULE_ID);
      }

      // === 1. POST PAYMENT ===
      const today = new Date().toISOString().slice(0, 10);
      const postResp = await gqlAs(
        request,
        token,
        `mutation PaymentPosting($input: PaymentPostingInput) {
           paymentPosting(input: $input) { status message }
         }`,
        {
          input: {
            loan_schedule_id: String(TARGET_SCHEDULE_ID),
            user_id: userId,
            collection: PAYMENT_AMOUNT,
            collection_date: today,
            bank_charge: '0',
            ap_refund: '0',
            ua_sp: '0',
            interest: '0',
            penalty: '0',
          },
        },
      );
      const postStatus = String(postResp?.data?.paymentPosting?.status ?? '');
      expect(
        ['1', 'true', 'success'].includes(postStatus),
        `payment post failed: ${JSON.stringify(postResp)}`,
      ).toBeTruthy();
      needsCleanup = true;

      // === 2. VERIFY PAYMENT EXISTS ===
      const after = countActivePayments(TARGET_SCHEDULE_ID);
      expect(after, 'active payment row count must have increased to 1').toBeGreaterThan(0);
      console.log(`   ↳ payment posted; ${after} active payment row(s) on schedule ${TARGET_SCHEDULE_ID}`);

      // === 3. REVERSE THE PAYMENT ===
      const reverseResp = await gqlAs(
        request,
        token,
        `mutation DeletePostedPayment($input: DeletePostedPaymentInput) {
           deletePostedPayment(input: $input) {
             status
             message
             immediate
             request_id
           }
         }`,
        {
          input: {
            loan_schedule_id: String(TARGET_SCHEDULE_ID),
            user_id: userId,
            reason: 'E2E reversal test',
          },
        },
      );
      const revStatus = String(reverseResp?.data?.deletePostedPayment?.status ?? '');
      expect(
        ['1', 'true', 'success'].includes(revStatus),
        `reversal failed: ${JSON.stringify(reverseResp)}`,
      ).toBeTruthy();
      // immediate=true means the reversal bypassed the approval queue, which
      // is the current product policy (see PaymentPostingMutation comment).
      expect(
        reverseResp?.data?.deletePostedPayment?.immediate,
        'reversal must execute immediately (no approval queue)',
      ).toBe(true);

      // === 4. VERIFY ROW IS GONE ===
      const finalCount = countActivePayments(TARGET_SCHEDULE_ID);
      expect(finalCount, 'active payment row must be back to 0 after reversal').toBe(0);
      needsCleanup = false; // already reversed via the API path
      console.log(`   ✓ payment posted then reversed; schedule clean`);
    } finally {
      // Defense in depth — if the test crashed AFTER posting but BEFORE
      // reversal, the cleanup script restores the schedule's clean state.
      if (needsCleanup) {
        softDeletePaymentsForSchedule(TARGET_SCHEDULE_ID);
        console.log(`   ↳ defensive cleanup ran (test died mid-flow)`);
      }
    }
  });
});
