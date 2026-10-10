"use client";

import React, { useMemo, useRef } from "react";
import { useRouter } from "nextjs-toploader/app";
import { ChevronDown, Trash2 } from "react-feather";
import { closeDetails, useDismissDetails } from "@/components/MoreMenu/dismissDetails";
import { useDeleteWithApproval } from "@/hooks/useDeleteWithApproval";
import useDeletionRequests from "@/hooks/useDeletionRequests";
import { usePendingDeletions } from "@/hooks/usePendingDeletions";
import { LOAN_DELETE, showPendingLoanDeletion } from "@/hooks/loanDelete";
import type { BorrLoanRowData } from "@/utils/DataTypes";

interface LoanMoreMenuProps {
  loan: BorrLoanRowData;
  /** Where to go once the loan is gone (an immediate, Owner delete): the Loans list. */
  onDeleted: () => void;
}

/** The loan header's quiet button, matching the borrower page's More (BorrowerHeader BUTTON). */
const SUMMARY = "min-h-[48px] lg:min-h-[40px] inline-flex items-center justify-center gap-2 rounded border border-stroke bg-white px-3 text-sm font-medium text-black shadow-1 transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-strokedark dark:bg-boxdark dark:text-white sm:px-4";

/**
 * Delete this loan with the Loans list's own flow (LOAN_DELETE, showPendingLoanDeletion), so the
 * page and the list can never disagree. A pending request opens the "Already in the queue" modal
 * (View in Approvals, or withdraw your own) instead of filing a second one.
 */
const useDeleteLoan = (loan: BorrLoanRowData, onDeleted: () => void) => {
  const router = useRouter();
  const loanId = Number(loan.id);
  const ids = useMemo(() => [loanId], [loanId]);
  const { pendingByEntityId, refresh: refreshPending } = usePendingDeletions("loan", ids);
  const { cancel: cancelDeletionRequest } = useDeletionRequests();
  const submitDelete = useDeleteWithApproval(LOAN_DELETE);
  const pending = pendingByEntityId.get(loanId);

  const startDelete = async () => {
    if (pending) {
      return showPendingLoanDeletion(pending, loan, {
        onView: () => router.push("/approvals"),
        cancel: cancelDeletionRequest,
        refresh: refreshPending,
      });
    }
    await submitDelete({ loan_id: String(loanId) }, { onAfterRequest: refreshPending, onImmediateSuccess: onDeleted });
  };

  return { pending, startDelete };
};

/**
 * "More ▾" on the loan page: the loan actions that should not sit one tap away, today Delete loan.
 * Same native <details> menu as the borrower page. The caller shows it only while the loan can be
 * deleted (isLoanDeletable), exactly when the Loans list shows Remove.
 */
const LoanMoreMenu: React.FC<LoanMoreMenuProps> = ({ loan, onDeleted }) => {
  const menu = useRef<HTMLDetailsElement>(null);
  useDismissDetails(menu);
  const { pending, startDelete } = useDeleteLoan(loan, onDeleted);

  const handleDelete = () => {
    // Focus goes back to More, so the prompt has a visible control to hand it back to.
    closeDetails(menu.current, true);
    void startDelete();
  };

  return (
    <details
      ref={menu}
      className="group"
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (next && !event.currentTarget.contains(next)) closeDetails(event.currentTarget, false);
      }}
    >
      <summary
        aria-label={pending ? "More actions (deletion pending)" : "More actions"}
        className={`${SUMMARY} cursor-pointer list-none group-open:border-primary group-open:text-primary [&::-webkit-details-marker]:hidden`}
      >
        {/* A pending request shows on the button itself, as the list's row badge does. */}
        {pending && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-warning" />}
        More
        <ChevronDown aria-hidden="true" size={16} className="-mr-0.5 shrink-0 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" />
      </summary>

      {/* Capped by the screen, not the small More + X row it opens from (max-w-full squeezed
          "Delete loan" onto two lines at 390px). Right-anchored, so it grows leftwards. */}
      <div className="absolute right-0 top-full z-10 mt-1 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded border border-stroke bg-white py-1 shadow-default dark:border-strokedark dark:bg-boxdark">
        <button
          type="button"
          onClick={handleDelete}
          className="flex min-h-[48px] w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-medium text-danger hover:bg-danger/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-danger lg:min-h-[40px]"
        >
          <Trash2 aria-hidden="true" size={16} className="shrink-0" />
          <span className="min-w-0">
            Delete loan
            {pending && <span className="block text-xs font-normal text-black/70 dark:text-bodydark">Already in the deletion queue</span>}
          </span>
        </button>
      </div>
    </details>
  );
};

export default LoanMoreMenu;
