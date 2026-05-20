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
