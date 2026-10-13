"use client";

import React, { useEffect, useRef } from "react";
import { X } from "react-feather";
import type { BulkResult } from "./useBulkDecision";

interface Props {
  result: BulkResult;
  onDismiss: () => void;
}

/**
 * What a bulk decision did, kept on screen until dismissed: "Approved 9 · 1 superseded ·
 * 2 not approved", and, behind a disclosure, each request that was not decided with the
 * server's reason. Those requests are still pending, so they are still in the list below.
 *
 * Not a live region itself (a region that mounts already filled is not reliably read):
 * ApprovalsView's persistent live region announces the line, and focus moves to the
 * heading when a run finishes, so keyboard users land on the result.
 */
const BulkResultStrip: React.FC<Props> = ({ result, onDismiss }) => {
  const approve = result.action === "approve";
  const failedCount = result.failed.length;
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, [result]);

  return (
    <section
      className={`appr-result${failedCount > 0 ? " has-failures" : ""}`}
      aria-labelledby="appr-result-line"
      data-testid="appr-result"
    >
      <div className="appr-result-head">
        <h4 className="appr-result-line" id="appr-result-line" tabIndex={-1} ref={heading}>
          <span className="appr-result-lead">
            {approve ? "Approved" : "Rejected"} <span className="appr-result-num">{result.decided}</span>
          </span>
          {result.superseded > 0 && (
            <span>
              <span className="appr-batch-dot" aria-hidden="true">·</span>
              <span className="appr-result-num">{result.superseded}</span> superseded
            </span>
          )}
          {failedCount > 0 && (
            <span className="appr-result-fail">
              <span className="appr-batch-dot" aria-hidden="true">·</span>
              <span className="appr-result-num">{failedCount}</span> not {approve ? "approved" : "rejected"}
            </span>
          )}
        </h4>
        <button type="button" className="appr-result-dismiss" onClick={onDismiss} aria-label="Dismiss result">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {failedCount > 0 && (
        <details className="appr-result-details">
          <summary>
            Why {failedCount === 1 ? "1 request is" : `${failedCount} requests are`} still pending
          </summary>
          <ul className="appr-result-list">
            {result.failed.map((f) => (
              <li key={f.id}>
                <span className="appr-kind-pill">{f.kind}</span>
                <span className="appr-result-item-label">{f.label}</span>
                <span className="appr-result-item-msg">{f.message}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
};

export default BulkResultStrip;
