import React from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { BulkDecisionAction, DeletionRequest } from "@/hooks/useDeletionRequests";
import { CONFIRM_COLORS } from "@/utils/brandColors";
import { describeRequest, leftOutLine, plural } from "./bulkScope";

const MySwal = withReactContent(Swal);

/** The reason "Reject all" saves on every request: required, 3 to 1000 characters. */
export const REJECT_REASON_MIN = 3;
export const REJECT_REASON_MAX = 1000;

const reasonError = (value: string): string | null =>
  value.trim().length >= REJECT_REASON_MIN
    ? null
    : `Write a reason of at least ${REJECT_REASON_MIN} characters. Each requester sees it.`;

const COPY: Record<BulkDecisionAction, { consequence: string; inputLabel: string; placeholder: string }> = {
  approve: {
    consequence: "Each record is deleted. This can't be undone from Fuerte.",
    inputLabel: "Approval note (optional, saved on each request)",
    placeholder: "e.g. confirmed duplicates from the 10/12 import",
  },
  reject: {
    consequence: "Each request is closed and its record stays. The requesters see your reason.",
    inputLabel: "Reason for rejecting (required, saved on each request)",
    placeholder: "e.g. these loans are still being collected, please re-check",
  },
};

const PreviewBody: React.FC<{ action: BulkDecisionAction; targets: DeletionRequest[]; leftOut: DeletionRequest[] }> = ({
  action,
  targets,
  leftOut,
}) => {
  const left = leftOutLine(leftOut);
  return (
    <div className="appr-bulk-dialog">
      <p className="appr-bulk-dialog-eyebrow">{plural(targets.length, "request")} on your screen</p>
      <ul className="appr-bulk-preview" aria-label="Requests to be decided" tabIndex={0}>
        {targets.map((r) => {
          const { kind, label } = describeRequest(r);
          return (
            <li key={r.id}>
              <span className="appr-kind-pill">{kind}</span>
              <span className="appr-bulk-preview-label">{label}</span>
            </li>
          );
        })}
      </ul>
      {left ? <p className="appr-bulk-dialog-left">Left out: {left}</p> : null}
      <p className={`appr-bulk-dialog-consequence is-${action}`}>{COPY[action].consequence}</p>
    </div>
  );
};

/** Reject: the confirm button stays disabled, with the reason inline, until the reason is valid. */
function watchReason(): void {
  const input = Swal.getInput() as HTMLTextAreaElement | null;
  const confirm = Swal.getConfirmButton();
  if (!input || !confirm) return;
  confirm.disabled = true;
  input.addEventListener("input", () => {
    const error = reasonError(input.value);
    if (error && input.value.length > 0) Swal.showValidationMessage(error);
    else Swal.resetValidationMessage();
    confirm.disabled = error !== null;
  });
}

/**
 * Where a cancelled review puts focus when its opener is gone: a refetch while it was open can
 * unmount the button (nothing left to approve, or fewer than two to decide). The bar's other
 * button if it is still there, else the active "Pending for me" tab.
 */
function focusFallback(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>("section.appr-batch .appr-batch-btn:not(:disabled)") ??
    document.querySelector<HTMLElement>('nav[aria-label="Approval views"] .appr-tab.is-active')
  );
}

/**
 * The review step before anything is sent: what will be decided (the exact requests, by the
 * name their card shows), what was left out, and what happens. Focus starts on Cancel, Escape
 * cancels. Returns the note (required for reject), or null when cancelled, after handing focus
 * back to `openedBy` (the clicked bar button; else whatever had focus when it opened).
 */
export async function showBulkReviewDialog(
  action: BulkDecisionAction,
  targets: DeletionRequest[],
  leftOut: DeletionRequest[],
  openedBy?: HTMLElement | null
): Promise<string | null> {
  const isApprove = action === "approve";
  // Cancel / Escape hand focus back here (see returnFocus). Given explicitly because Safari does
  // not focus a clicked button, so document.activeElement would be <body> there.
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const opener = openedBy ?? active;
  const result = await MySwal.fire({
    title: isApprove ? `Approve ${plural(targets.length, "deletion")}?` : `Reject ${plural(targets.length, "request")}?`,
    html: <PreviewBody action={action} targets={targets} leftOut={leftOut} />,
    input: "textarea",
    inputLabel: COPY[action].inputLabel,
    inputPlaceholder: COPY[action].placeholder,
    inputAutoFocus: false,
    inputAttributes: { "aria-label": COPY[action].inputLabel, maxlength: String(REJECT_REASON_MAX) },
    ...(isApprove ? {} : { inputValidator: (value: string) => reasonError(value ?? "") ?? undefined, didOpen: watchReason }),
    showCancelButton: true,
    focusCancel: true,
    // Don't let SweetAlert hand focus back on close: after a run the result heading takes it, and
    // SweetAlert's late return-focus would otherwise snatch it back. A cancel returns it below.
    returnFocus: false,
    confirmButtonText: isApprove ? `Approve ${plural(targets.length, "deletion")}` : `Reject ${plural(targets.length, "request")}`,
    cancelButtonText: "Cancel",
    confirmButtonColor: isApprove ? CONFIRM_COLORS.confirm : CONFIRM_COLORS.reject,
    cancelButtonColor: CONFIRM_COLORS.cancel,
    customClass: { popup: "appr-bulk-popup" },
    background: "#ffffff",
  });
  if (!result.isConfirmed) {
    // Cancelled or dismissed: no run follows, so focus goes back to the opener, not to <body>.
    (opener?.isConnected ? opener : focusFallback())?.focus();
    return null;
  }
  const note = typeof result.value === "string" ? result.value.trim() : "";
  return note;
}
