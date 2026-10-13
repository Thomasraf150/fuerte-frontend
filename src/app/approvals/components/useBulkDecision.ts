"use client";

import { useCallback, useState } from "react";
import type {
  BulkDecisionAction,
  DeletionBulkItem,
  DeletionRequest,
} from "@/hooks/useDeletionRequests";
import { approvalOrder, describeRequest, plural, type BulkScope } from "./bulkScope";
import { showBulkReviewDialog } from "./bulkReviewDialog";

export interface BulkFailure {
  id: string;
  kind: string;
  label: string;
  message: string;
}

export interface BulkResult {
  action: BulkDecisionAction;
  decided: number;
  superseded: number;
  failed: BulkFailure[];
}

export interface BulkRunning {
  action: BulkDecisionAction;
  count: number;
}

type DecideMany = (action: BulkDecisionAction, ids: string[], note: string) => Promise<DeletionBulkItem[]>;

/** Tallies the server's per-request answers; a not-decided one keeps the card's name and the server's reason. */
export function summarise(
  action: BulkDecisionAction,
  items: DeletionBulkItem[],
  targets: DeletionRequest[]
): BulkResult {
  const byId = new Map(targets.map((r) => [String(r.id), r]));
  const result: BulkResult = { action, decided: 0, superseded: 0, failed: [] };
  items.forEach((item) => {
    if (item.outcome === "approved" || item.outcome === "rejected") result.decided += 1;
    else if (item.outcome === "superseded") result.superseded += 1;
    else {
      const request = byId.get(item.id);
      const { kind, label } = request ? describeRequest(request) : { kind: item.entity_type ?? "", label: `Request #${item.id}` };
      result.failed.push({ id: item.id, kind, label, message: item.message || "Not decided." });
    }
  });
  return result;
}

/** "Approved 9 · 1 superseded · 2 not approved": the strip's line, and what is announced. */
export function summaryLine(result: BulkResult, separator = " · "): string {
  const approve = result.action === "approve";
  const parts = [`${approve ? "Approved" : "Rejected"} ${result.decided}`];
  if (result.superseded > 0) parts.push(`${result.superseded} superseded`);
  if (result.failed.length > 0) parts.push(`${result.failed.length} not ${approve ? "approved" : "rejected"}`);
  return parts.join(separator);
}

/**
 * "Approve all" / "Reject all": review dialog, then the bulk calls, then the result strip.
 * The targets are fixed when the button is clicked (what is on screen then, nothing that
 * arrives later). `onDone` refreshes the lists and the bell/sidebar counts; the bar stays
 * disabled until it has finished, so it never acts on the list from before the run.
 * `announcement` feeds the page's one persistent live region: the busy line, then the result.
 */
export function useBulkDecision(decideMany: DecideMany, onDone: () => Promise<void>) {
  const [running, setRunning] = useState<BulkRunning | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const run = useCallback(
    async (action: BulkDecisionAction, scope: BulkScope, opener?: HTMLElement | null) => {
      if (running) return;
      const targets = action === "approve" ? scope.approvable : scope.decidable;
      if (targets.length === 0) return;
      const note = await showBulkReviewDialog(action, targets, action === "approve" ? scope.leftOut : [], opener);
      if (note === null) return;
      const ordered = action === "approve" ? approvalOrder(targets) : targets;
      setResult(null);
      setRunning({ action, count: targets.length });
      setAnnouncement(`Deciding ${plural(targets.length, "request")}…`);
      try {
        const items = await decideMany(action, ordered.map((r) => String(r.id)), note);
        const summary = summarise(action, items, targets);
        setResult(summary);
        setAnnouncement(`${summaryLine(summary, ", ")}.`);
        await onDone();
      } finally {
        setRunning(null);
      }
    },
    [running, decideMany, onDone]
  );

  const dismiss = useCallback(() => setResult(null), []);

  return { running, result, announcement, run, dismiss };
}
