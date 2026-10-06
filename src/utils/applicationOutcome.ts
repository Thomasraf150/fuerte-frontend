/**
 * Where an application ended up (its server-computed `outcome`), and the Applications list's
 * link-able filters: `?outcome=&status=&from=&to=`. Free of React and the network, so the
 * Playwright runner tests it directly (tests/e2e/30-applicant-funnel).
 */
import type { ApplicationOutcome, LoanApplicationStatus } from './DataTypes';
import type { DayRange } from './sourceTracker';

/**
 * How loud an outcome is drawn:
 *   - waiting: nothing decided yet (an interview, a borrower with no decision);
 *   - progress: on its way (approved, a loan being processed);
 *   - success: the loan was released;
 *   - warning: it stopped without anyone saying no (a cancelled loan, a deleted borrower);
 *   - danger: someone said no (declined, rejected).
 */
export type OutcomeTone = 'waiting' | 'progress' | 'success' | 'warning' | 'danger';

interface OutcomeInfo {
  key: ApplicationOutcome;
  /** The filter's word, and the pill's when the server sent none. */
  label: string;
  tone: OutcomeTone;
}

/** The eleven outcomes, in the order an application moves through them; the filter lists them so. */
export const OUTCOMES: readonly OutcomeInfo[] = [
  { key: 'for_interview', label: 'Waiting for interview', tone: 'waiting' },
  { key: 'interviewed', label: 'Interviewed', tone: 'waiting' },
  { key: 'declined', label: 'Declined', tone: 'danger' },
  { key: 'borrower', label: 'Borrower, no decision yet', tone: 'waiting' },
  { key: 'approved', label: 'Approved, no loan yet', tone: 'progress' },
  { key: 'loan_in_process', label: 'Loan in process', tone: 'progress' },
  { key: 'loan_released', label: 'Loan released', tone: 'success' },
  { key: 'loan_cancelled', label: 'Loan cancelled', tone: 'warning' },
  { key: 'rejected', label: 'Rejected', tone: 'danger' },
  { key: 'rejected_with_loan', label: 'Rejected, has a loan', tone: 'danger' },
  { key: 'borrower_deleted', label: 'Borrower deleted', tone: 'warning' },
];

const BY_KEY = new Map<string, OutcomeInfo>(OUTCOMES.map((info) => [info.key, info]));

export const isOutcome = (value: unknown): value is ApplicationOutcome => typeof value === 'string' && BY_KEY.has(value);

/** The outcome's filter word; the key itself for one this page does not know. */
export const outcomeLabel = (key: string): string => BY_KEY.get(key)?.label ?? key;

/** The outcome's tone; an unknown one is drawn quiet. */
export const outcomeTone = (key: string): OutcomeTone => BY_KEY.get(key)?.tone ?? 'waiting';

// ---------------------------------------------------------------------------
// The list's link-able filters
// ---------------------------------------------------------------------------

const STATUSES: readonly LoanApplicationStatus[] = ['for_interview', 'interviewed', 'declined', 'borrower_created'];

/** What a link may set on the Applications list. Anything missing or malformed is simply not set. */
export interface ListParams {
  outcome: ApplicationOutcome | null;
  status: LoanApplicationStatus | null;
  /** The days applied, both ends inclusive; null for any day. */
  period: DayRange | null;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar day as Y-m-d ("2026-02-30" is not one). */
const isDay = (value: unknown): value is string => {
  if (typeof value !== 'string' || !DAY.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

type RawParams = Record<string, string | string[] | undefined>;

/** The first value of a query parameter: `?outcome=a&outcome=b` reads as `a`. */
const first = (raw: RawParams, name: string): string | undefined => {
  const value = raw[name];
  return Array.isArray(value) ? value[0] : value;
};

/**
 * The list's filters from its URL. A period needs both days, in order; one without the other,
 * or backwards, is ignored rather than guessed at.
 */
export function readListParams(raw: RawParams): ListParams {
  const outcome = first(raw, 'outcome');
  const status = first(raw, 'status');
  const from = first(raw, 'from');
  const to = first(raw, 'to');
  return {
    outcome: isOutcome(outcome) ? outcome : null,
    status: STATUSES.includes(status as LoanApplicationStatus) ? (status as LoanApplicationStatus) : null,
    period: isDay(from) && isDay(to) && from <= to ? { from, to } : null,
  };
}

/** `/applications?outcome=…&status=…&from=…&to=…`, with only what is set. */
export function listHref(params: Partial<ListParams>): string {
  const query = new URLSearchParams();
  if (params.outcome) query.set('outcome', params.outcome);
  if (params.status) query.set('status', params.status);
  if (params.period) {
    query.set('from', params.period.from);
    query.set('to', params.period.to);
  }
  const text = query.toString();
  return text ? `/applications?${text}` : '/applications';
}
