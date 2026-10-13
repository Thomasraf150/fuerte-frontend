"use client";

import React from "react";
import { Check, X } from "react-feather";
import { countByType, leftOutLine, plural, typePhrase, type BulkScope } from "./bulkScope";
import type { BulkRunning } from "./useBulkDecision";

interface Props {
  scope: BulkScope;
  running: BulkRunning | null;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * The strip above the "Pending for me" list that decides every request on screen at once.
 * Each button says how many it acts on and what it does; "Approve" only counts loans and
 * borrowers, and the line under the counts names what it leaves for a one-by-one review.
 * The busy line is visual; ApprovalsView's persistent live region announces it.
 */
const BatchBar: React.FC<Props> = ({ scope, running, onApprove, onReject }) => {
  const waiting = scope.decidable.length;
  const approvable = scope.approvable.length;
  const left = leftOutLine(scope.leftOut);
  const busy = running !== null;

  return (
    <section className={`appr-batch${busy ? " is-running" : ""}`} aria-labelledby="appr-batch-title" aria-busy={busy}>
      <div className="appr-batch-rule" aria-hidden="true" />
      <div className="appr-batch-body">
        <div className="appr-batch-summary">
          <h4 className="appr-batch-eyebrow" id="appr-batch-title">Decide everything on screen</h4>
          <p className="appr-batch-counts" data-testid="appr-batch-counts">
            <span className="appr-batch-num">{waiting}</span> waiting
            {/* Loans and borrowers first: they are what "Approve" counts. */}
            {countByType([...scope.approvable, ...scope.leftOut]).map(({ type, count }) => (
              <span key={type} className="appr-batch-type">
                <span className="appr-batch-dot" aria-hidden="true">·</span>
                {typePhrase(type, count)}
              </span>
            ))}
          </p>
          {left ? <p className="appr-batch-left">{left}</p> : null}
          {/* Visible only: the page's persistent live region (ApprovalsView) announces it. */}
          <p className="appr-batch-status" aria-hidden="true">
            {running ? `Deciding ${plural(running.count, "request")}…` : ""}
          </p>
        </div>

        <div className="appr-batch-actions">
          {approvable > 0 && (
            <button type="button" className="appr-batch-btn is-approve" onClick={onApprove} disabled={busy}>
              <Check size={16} aria-hidden="true" />
              {running?.action === "approve" ? "Approving…" : `Approve ${plural(approvable, "deletion")}`}
            </button>
          )}
          <button type="button" className="appr-batch-btn is-reject" onClick={onReject} disabled={busy}>
            <X size={16} aria-hidden="true" />
            {running?.action === "reject" ? "Rejecting…" : `Reject all ${waiting}`}
          </button>
        </div>
      </div>
    </section>
  );
};

export default BatchBar;
