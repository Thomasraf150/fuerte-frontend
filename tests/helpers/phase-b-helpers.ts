/**
 * Phase B end-to-end test helpers.
 *
 * Shells out to a CLI script inside the backend container so the Playwright
 * test can:
 *   - Verify DB state directly (cleaner than scraping the UI)
 *   - Soft-delete the test payments + accounting entries afterwards, mimicking
 *     what the in-app "Reverse Payment" mutation does, but without going
 *     through the deletion-approval workflow (admin user can't bypass it;
 *     only OWNER can — see User::canBypassDeletionApproval).
 *
 * No production data is touched: the test only writes to a single schedule_id
 * we pass in, and only soft-deletes records the test itself just created.
 */

import { execFileSync } from 'child_process';

const CONTAINER = 'fuerte-app-1';
const SCRIPT = 'tests/phase_b_db_ops.php';

function dockerPhp(args: string[]): string {
  // execFileSync avoids shell interpolation — no escaping headaches on Windows.
  const out = execFileSync('docker', ['exec', CONTAINER, 'php', SCRIPT, ...args], {
    encoding: 'utf8',
  });
  return out.trim();
}

/** How many ACTIVE loan_payment rows exist on this schedule right now. */
export function countActivePayments(scheduleId: string | number): number {
  return parseInt(dockerPhp(['count', String(scheduleId)]), 10);
}

/** Read the amount of the active payment with a given description on this schedule. */
export function paymentAmount(scheduleId: string | number, description: string): string | null {
  const out = dockerPhp(['amount', String(scheduleId), description]);
  return out === 'NULL' ? null : out;
}

/** Soft-delete every active payment on this schedule AND the related accounting entries. */
export function softDeletePaymentsForSchedule(scheduleId: string | number): void {
  dockerPhp(['cleanup', String(scheduleId)]);
}

/** Remaining amortization on a schedule as the Payment Posting screen computes it
 *  (Collection settles; Advanced Payment / Payment UA/SP do NOT). '0.00' = fully settled. */
export function remainingAmort(scheduleId: string | number): string {
  return dockerPhp(['remaining', String(scheduleId)]);
}

/** Number of General Ledger entries linked to this schedule's active payments (>=1 = booked). */
export function glEntryCount(scheduleId: string | number): number {
  return parseInt(dockerPhp(['gl', String(scheduleId)]), 10);
}

/** Soft-delete ALL active payments + accounting entries for an entire loan (idempotent reset). */
export function cleanupLoan(loanId: string | number): void {
  dockerPhp(['cleanup-loan', String(loanId)]);
}

export interface AccessibleLoan {
  loanId: string;
  scheduleId: string;
  dueDate: string; // YYYY-MM-DD
  amort: string;
  udi: string;
}

/** Find a fully-clean, open loan in a branch_sub the test user can access, with a UDI-bearing
 *  schedule. Returns null if none — lets the spec skip gracefully instead of hard-failing. */
export function findAccessibleLoan(branchSubId: string | number): AccessibleLoan | null {
  const out = dockerPhp(['find-loan', String(branchSubId)]);
  if (!out.includes('|')) return null;
  const [loanId, scheduleId, dueDate, amort, udi] = out.split('|');
  return { loanId, scheduleId, dueDate, amort, udi };
}

export interface SoaView {
  finalBalance: number;
  advancePayment: number;
  paymentUaSp: number;
  collection: number;
}

/** SOA (sp_customer_ledger) view for a schedule: the loan's final running balance + the
 *  schedule's Advanced Payment / Payment UA/SP / Collection display columns. */
export function soaView(scheduleId: string | number): SoaView {
  const out = dockerPhp(['soa', String(scheduleId)]);
  const [finalBalance, advancePayment, paymentUaSp, collection] = out.split('|').map((n) => parseFloat(n));
  return { finalBalance, advancePayment, paymentUaSp, collection };
}
