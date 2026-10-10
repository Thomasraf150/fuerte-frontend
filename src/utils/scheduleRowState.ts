import type { DataRowLoanSchedules } from './DataTypes';

/**
 * What one instalment on the Payment Posting schedule is, for its badge and row marker (2026-10-10).
 * The server sends each row's `amount` as what is STILL DUE (ScheduleSettlement::remaining), which is
 * why a paid row used to read 0.00 / 0.00 with a disabled "Paid" button. States:
 *   paid      nothing left                                         olive ✓, quiet row
 *   overdue   something left and the due date is before today (Manila)   red bar + badge
 *   next      the first open row that is not overdue: where to post next  gold bar + badge
 *   upcoming  anything later                                       no badge
 * "Partly paid" is not a state but a fact on any open row (paidCents > 0): an overdue row can be
 * partly paid and is still overdue. Money is summed in whole centavos (no float drift); it is
 * display only, never posted back.
 */
export type ScheduleRowState = 'paid' | 'overdue' | 'next' | 'upcoming';

export interface ScheduleRowView {
  state: ScheduleRowState;
  /** Centavos collected against this instalment ("Collection" lines). */
  paidCents: number;
  /** Centavos still due. */
  dueCents: number;
  /** Latest collection day (YYYY-MM-DD), when anything was paid. */
  paidOn: string | null;
  /** Whether a payment exists to reverse. */
  hasPayments: boolean;
}

const cents = (v: unknown): number => Math.round(Number(v ?? 0) * 100);

/** Each row's view; `today` is Manila's YYYY-MM-DD (sourceTracker.manilaToday). */
export function scheduleRowViews(rows: DataRowLoanSchedules[] | undefined, today: string): ScheduleRowView[] {
  let nextTaken = false;
  return (rows ?? []).map((row) => {
    const payments = row.loan_payments ?? [];
    const collections = payments.filter((p) => p.description === 'Collection');
    const paidCents = collections.reduce((sum, p) => sum + cents(p.amount), 0);
    const dueCents = Math.max(0, cents(row.amount));
    const paidOn = collections.map((p) => String(p.trans_date ?? '').slice(0, 10)).filter(Boolean).sort().pop() ?? null;

    let state: ScheduleRowState = 'upcoming';
    if (dueCents === 0) state = 'paid';
    else if (String(row.due_date).slice(0, 10) < today) state = 'overdue';
    else if (!nextTaken) { state = 'next'; nextTaken = true; }

    return { state, paidCents, dueCents, paidOn, hasPayments: payments.length > 0 };
  });
}

/** "₱5,000.00" from centavos. */
export const peso = (c: number): string =>
  '₱' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "Oct 10, 2026" from YYYY-MM-DD, read as a calendar day (no timezone shift). */
export const longDay = (ymd: string): string => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};
