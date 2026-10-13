import type { DeletionRequest } from "@/hooks/useDeletionRequests";
import { ENTITY_LABEL, parseSnapshotLabel } from "./DeletionRequestCard";

/**
 * Which requests "Approve all" / "Reject all" act on (Rafael, 2026-10-13):
 * - only the ones on the "Pending for me" tab that the viewer can decide (an approver,
 *   and not their own request), exactly as the cards decide `canDecide`;
 * - "Approve all" only loans and borrowers; every other type (branch, sub-branch, loan
 *   type, posted payment) is left for a one-by-one review;
 * - "Reject all" every decidable request.
 */
export const BULK_APPROVABLE_TYPES: ReadonlySet<string> = new Set(["loan", "borrower"]);

export interface BulkScope {
  decidable: DeletionRequest[];
  approvable: DeletionRequest[];
  leftOut: DeletionRequest[];
}

export function bulkScope(
  pending: DeletionRequest[],
  isApprover: boolean,
  userId: number | undefined
): BulkScope {
  const decidable = isApprover ? pending.filter((r) => r.requested_by_user_id !== userId) : [];
  return {
    decidable,
    approvable: decidable.filter((r) => BULK_APPROVABLE_TYPES.has(r.entity_type)),
    leftOut: decidable.filter((r) => !BULK_APPROVABLE_TYPES.has(r.entity_type)),
  };
}

/**
 * The order "Approve all" sends ids in: loans first, then borrowers, each by ascending id.
 * The server takes 50 ids a call, so screen order (newest first) could put a borrower in
 * one call and its loan in a later one, and the borrower's deletion would fail while it
 * still had a live loan. Loans first means every loan call lands before any borrower call.
 */
export function approvalOrder(requests: DeletionRequest[]): DeletionRequest[] {
  const rank = (r: DeletionRequest) => (r.entity_type === "loan" ? 0 : 1);
  return [...requests].sort((a, b) => rank(a) - rank(b) || Number(a.id) - Number(b.id));
}

const NOUN: Record<string, [string, string]> = {
  loan: ["loan", "loans"],
  borrower: ["borrower", "borrowers"],
  posted_payment: ["posted payment", "posted payments"],
  branch: ["branch", "branches"],
  branch_sub: ["sub-branch", "sub-branches"],
  loan_type: ["loan type", "loan types"],
};

const noun = (type: string, count: number): string => {
  const [one, many] = NOUN[type] ?? [type.replace(/_/g, " "), `${type.replace(/_/g, " ")}s`];
  return count === 1 ? one : many;
};

/** "10 deletions", "1 deletion". */
export const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

/** Counts by entity type, in the order the types first appear on screen. */
export function countByType(requests: DeletionRequest[]): Array<{ type: string; count: number }> {
  const counts = new Map<string, number>();
  requests.forEach((r) => counts.set(r.entity_type, (counts.get(r.entity_type) ?? 0) + 1));
  return Array.from(counts, ([type, count]) => ({ type, count }));
}

/** "10 loans", "1 borrower". */
export const typePhrase = (type: string, count: number): string => `${count} ${noun(type, count)}`;

const joinAnd = (parts: string[]): string =>
  parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

/** "2 branch deletions need a one-by-one review." — or null when nothing was left out. */
export function leftOutLine(leftOut: DeletionRequest[]): string | null {
  if (leftOut.length === 0) return null;
  const parts = countByType(leftOut).map(({ type, count }) => `${count} ${noun(type, 1)} ${count === 1 ? "deletion" : "deletions"}`);
  return `${joinAnd(parts)} ${leftOut.length === 1 ? "needs" : "need"} a one-by-one review.`;
}

/** The kind pill and the record name a card shows, for previews and failure lists. */
export function describeRequest(r: DeletionRequest): { kind: string; label: string } {
  return {
    kind: ENTITY_LABEL[r.entity_type] ?? r.entity_type,
    label: parseSnapshotLabel(r.entity_snapshot, `${r.entity_type} #${r.entity_id}`),
  };
}
