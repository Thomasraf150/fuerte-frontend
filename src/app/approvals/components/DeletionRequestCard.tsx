"use client";

import React, { useState } from "react";
import { Check, X, RotateCcw } from "react-feather";
import type { DeletionRequest } from "@/hooks/useDeletionRequests";
import {
  showConfirmationModal,
  showDecisionNotePrompt,
  showProcessingModal,
} from "@/components/ConfirmationModal";

interface Props {
  request: DeletionRequest;
  canDecide: boolean;
  canCancel: boolean;
  onApprove?: (id: string, note: string) => Promise<void>;
  onReject?: (id: string, note: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
}

const ENTITY_LABEL: Record<string, string> = {
  loan: "Loan",
  borrower: "Borrower",
  posted_payment: "Posted Payment",
  branch: "Branch",
  branch_sub: "Sub-Branch",
  loan_type: "Loan Type",
};

function parseSnapshotLabel(snapshotRaw: string | null, fallback: string): string {
  if (!snapshotRaw) return fallback;
  try {
    const snap = typeof snapshotRaw === "string" ? JSON.parse(snapshotRaw) : snapshotRaw;
    return snap?.label || fallback;
  } catch {
    return fallback;
  }
}

function formatStamp(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DeletionRequestCard: React.FC<Props> = ({
  request,
  canDecide,
  canCancel,
  onApprove,
  onReject,
  onCancel,
}) => {
  const [busy, setBusy] = useState<null | "approve" | "reject" | "cancel">(null);

  const entityLabel = parseSnapshotLabel(
    request.entity_snapshot,
    `${request.entity_type} #${request.entity_id}`
  );
  const kindLabel = ENTITY_LABEL[request.entity_type] ?? request.entity_type;

  const handle = async (action: "approve" | "reject" | "cancel") => {
    if (busy) return;

    if (action === "approve" && onApprove) {
      const note = await showDecisionNotePrompt(
        "Approve this deletion?",
        "Approval note (optional, shown to the requester)",
        "Approve",
        {
          text: `${kindLabel} — ${entityLabel}`,
          confirmColor: "#16a34a",
          placeholder: "e.g. confirmed duplicate",
        }
      );
      if (note === null) return;
      setBusy("approve");
      const close = showProcessingModal("Approving…");
      try {
        await onApprove(request.id, note);
      } finally {
        close();
        setBusy(null);
      }
      return;
    }

    if (action === "reject" && onReject) {
      const note = await showDecisionNotePrompt(
        "Reject this request?",
        "Reason for rejection (optional, shown to the requester)",
        "Reject",
        {
          text: `${kindLabel} — ${entityLabel}`,
          confirmColor: "#dc2626",
          placeholder: "e.g. wrong borrower, please re-check",
        }
      );
      if (note === null) return;
      setBusy("reject");
      const close = showProcessingModal("Rejecting…");
      try {
        await onReject(request.id, note);
      } finally {
        close();
        setBusy(null);
      }
      return;
    }

    if (action === "cancel" && onCancel) {
      const yes = await showConfirmationModal(
        "Delete this request?",
        "It will no longer be visible to approvers.",
        "Delete request"
      );
      if (!yes) return;
      setBusy("cancel");
      const close = showProcessingModal("Deleting request…");
      try {
        await onCancel(request.id);
      } finally {
        close();
        setBusy(null);
      }
    }
  };

  return (
    <article className={`appr-card is-${request.status}`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <span className="appr-kind-pill">{kindLabel}</span>
            <span className={`appr-status-pill is-${request.status}`}>{request.status}</span>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-auto">
              REQ-{String(request.id).padStart(5, "0")}
            </span>
          </div>

          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-3">{entityLabel}</h3>

          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">Requested by</span>{" "}
              {request.requestedBy?.name ?? `User #${request.requested_by_user_id}`}
            </span>
            <span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">Branch</span>{" "}
              {request.branchSub?.name ?? request.branch?.name ?? "System-wide"}
            </span>
            <span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">Filed</span> {formatStamp(request.created_at)}
            </span>
          </div>

          {request.reason ? <div className="appr-reason">{request.reason}</div> : null}

          {request.status !== "pending" && request.decided_at ? (
            <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-slate-700 dark:text-slate-200 font-medium uppercase tracking-wider">
                {request.status}
              </span>{" "}
              by {request.decidedBy?.name ?? "—"} on {formatStamp(request.decided_at)}
              {request.decision_note ? ` — ${request.decision_note}` : ""}
            </div>
          ) : null}
        </div>

        {(canDecide || canCancel) && request.status === "pending" && (
          <div className="flex flex-col gap-2 shrink-0">
            {canDecide && (
              <>
                <button
                  type="button"
                  className="appr-btn appr-btn-approve"
                  onClick={() => handle("approve")}
                  disabled={busy !== null}
                >
                  <Check size={14} />
                  {busy === "approve" ? "Approving…" : "Approve"}
                </button>
                <button
                  type="button"
                  className="appr-btn appr-btn-reject"
                  onClick={() => handle("reject")}
                  disabled={busy !== null}
                >
                  <X size={14} />
                  {busy === "reject" ? "Rejecting…" : "Reject"}
                </button>
              </>
            )}

            {canCancel && (
              <button
                type="button"
                className="appr-btn appr-btn-cancel"
                onClick={() => handle("cancel")}
                disabled={busy !== null}
              >
                <RotateCcw size={14} />
                {busy === "cancel" ? "Deleting…" : "Delete request"}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default DeletionRequestCard;
