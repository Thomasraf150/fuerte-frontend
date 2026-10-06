/**
 * The applicant funnel's own logic (Source tracker, /applications/tracker): which counts are the
 * four steps, the exits, the waiting stages and the exceptions, and where each number links in the
 * Applications list. Free of React and the network, so tests/e2e/30-applicant-funnel tests it directly.
 */
import type {
  ApplicationFunnel,
  ApplicationFunnelCounts,
  ApplicationOutcome,
  LoanApplicationChannel,
  LoanApplicationStatus,
} from './DataTypes';
import { CHANNELS, CHANNEL_SHORT_LABELS } from './applicationForm';
import { listHref } from './applicationOutcome';
import type { DayRange } from './sourceTracker';

export type FunnelKey = keyof ApplicationFunnelCounts;

/**
 * What a number opens in the Applications list: an outcome, a status, or just the period (`{}`).
 * null: the list has no filter that holds exactly these applications, so the number is not a link.
 */
type Target = { outcome?: ApplicationOutcome; status?: LoanApplicationStatus } | null;

export interface FunnelItem {
  key: FunnelKey;
  label: string;
  target: Target;
}

/**
 * The four steps. "Approved" counts every application whose borrower's latest decision is Approved,
 * loan or not, and no outcome holds exactly those (the outcome `approved` is "Approved, no loan
 * yet"), so the step is not a link; its waiting stage below is. Became borrower is every application
 * with a borrower, which is the status Borrower created. Got a loan counts exactly the outcome
 * loan_released (the server's rule; a rejected borrower's old loan is rejected_with_loan, an
 * exception), so its link opens the same applications it counts.
 */
export const FUNNEL_STEPS: readonly FunnelItem[] = [
  { key: 'applied', label: 'Applied', target: {} },
  { key: 'became_borrower', label: 'Became borrower', target: { status: 'borrower_created' } },
  { key: 'approved', label: 'Approved', target: null },
  { key: 'loan_released', label: 'Got a loan', target: { outcome: 'loan_released' } },
];

/** Where applicants left: someone said no, or the loan was cancelled. */
export const FUNNEL_EXITS: readonly FunnelItem[] = [
  { key: 'declined', label: 'Declined', target: { outcome: 'declined' } },
  { key: 'rejected', label: 'Rejected', target: { outcome: 'rejected' } },
  { key: 'loan_cancelled', label: 'Loan cancelled', target: { outcome: 'loan_cancelled' } },
];

/** Where applicants are still waiting on someone. */
export const FUNNEL_WAITING: readonly FunnelItem[] = [
  { key: 'for_interview', label: 'For interview', target: { outcome: 'for_interview' } },
  { key: 'interviewed', label: 'Interviewed', target: { outcome: 'interviewed' } },
  { key: 'borrower', label: 'Borrower, no decision', target: { outcome: 'borrower' } },
  { key: 'approved_no_loan', label: 'Approved, no loan', target: { outcome: 'approved' } },
  { key: 'loan_in_process', label: 'Loan in process', target: { outcome: 'loan_in_process' } },
];

/**
 * What should not happen, shown only when it did. "Got a loan without Approve" is a flag on
 * released loans, not an outcome of its own, so the list cannot filter it: not a link.
 */
export const FUNNEL_EXCEPTIONS: readonly FunnelItem[] = [
  { key: 'rejected_with_loan', label: 'Rejected but has a loan', target: { outcome: 'rejected_with_loan' } },
  { key: 'released_without_approval', label: 'Got a loan without Approve', target: null },
  { key: 'borrower_deleted', label: 'Borrower deleted', target: { outcome: 'borrower_deleted' } },
];

const ALL_KEYS: readonly FunnelKey[] = [...FUNNEL_STEPS, ...FUNNEL_EXITS, ...FUNNEL_WAITING, ...FUNNEL_EXCEPTIONS].map((item) => item.key);

/** A server count as a whole number, never negative; a missing one is 0. */
const wholeCount = (value: unknown): number => Math.max(0, Math.trunc(Number(value)) || 0);

/** Every count present and whole, whatever the server sent. */
export function wholeCounts(raw: Partial<Record<FunnelKey, unknown>> | null | undefined): ApplicationFunnelCounts {
  const counts = {} as ApplicationFunnelCounts;
  for (const key of ALL_KEYS) counts[key] = wholeCount(raw?.[key]);
  return counts;
}

/** A channel's place: the form's order, as the source cards above have it; any other (no source) last. */
const channelRank = (channel: string): number => {
  const index = (CHANNELS as readonly string[]).indexOf(channel);
  return index === -1 ? CHANNELS.length : index;
};

/** The funnel with every count whole, and the channels in the form's order, "no source" last. */
export function normalizeFunnel(raw: ApplicationFunnel): ApplicationFunnel {
  const byChannel = (raw.by_channel ?? []).map((row) => ({ channel: String(row.channel), counts: wholeCounts(row.counts) }));
  byChannel.sort((a, b) => channelRank(a.channel) - channelRank(b.channel));
  return { total: wholeCounts(raw.total), by_channel: byChannel };
}

/** A channel's name in the per-source table: the source's short label, or "Not recorded". */
export const channelName = (channel: string): string =>
  channel in CHANNEL_SHORT_LABELS ? CHANNEL_SHORT_LABELS[channel as LoanApplicationChannel] : 'Not recorded';

/** Where a number links, for the days on screen; null when it is not a link. */
export const funnelHref = (target: Target, range: DayRange): string | null =>
  target ? listHref({ ...target, period: range }) : null;
