"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useRouter } from "nextjs-toploader/app";
import { ChevronDown, Trash2 } from "react-feather";
import { useDeleteWithApproval } from "@/hooks/useDeleteWithApproval";
import useDeletionRequests from "@/hooks/useDeletionRequests";
import { usePendingDeletions } from "@/hooks/usePendingDeletions";
import type { BorrowerRowInfo } from "@/utils/DataTypes";
import { BORROWER_DELETE, showPendingBorrowerDeletion } from "@/hooks/borrowerDelete";

interface BorrowerMoreMenuProps {
  borrower: BorrowerRowInfo;
  /** The header's button look, for the "More" summary. */
  summaryClassName: string;
}

/** Close a <details>; with `returnFocus`, put the focus back on its summary. */
const closeDetails = (details: HTMLDetailsElement | null, returnFocus: boolean): void => {
  if (!details) return;
  details.open = false;
  if (returnFocus) details.querySelector("summary")?.focus();
};

/**
 * Escape and a click outside close an open <details>, which does neither by itself. Escape hands
 * the focus back to More only when it was inside the menu; elsewhere (an open picker in the form,
 * say) it just closes the menu and leaves the focus where it is.
 *
 * The listeners stay on for the menu's life and read details.open when the event arrives. They
 * used to wait for React state set from the toggle event, which the browser fires a task later,
 * so an Escape pressed right after opening reached no listener (seen as a flaky e2e, 2026-10-06).
 */
const useDismissDetails = (menu: React.RefObject<HTMLDetailsElement>): void => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !menu.current?.open) return;
      closeDetails(menu.current, !!menu.current?.contains(document.activeElement));
    };
    const onPointerDown = (event: PointerEvent) => {
      if (menu.current?.open && !menu.current.contains(event.target as Node)) closeDetails(menu.current, false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menu]);
};

/**
 * Delete this borrower with the Borrowers list's flow: useDeleteWithApproval with the same
 * BORROWER_DELETE definition, and, when a request is already pending for this borrower, the same
 * "Already in the queue" modal (showPendingBorrowerDeletion, which the list uses too).
 * An immediate delete (Admin, Owner, Branch Admin) leaves no borrower behind the page: back to the list.
 */
const useDeleteBorrower = (borrower: BorrowerRowInfo) => {
  const router = useRouter();
  const borrowerId = Number(borrower.id);
  const ids = useMemo(() => [borrowerId], [borrowerId]);
  const { pendingByEntityId, refresh: refreshPending } = usePendingDeletions("borrower", ids);
  const { cancel: cancelDeletionRequest } = useDeletionRequests();
  const submitDelete = useDeleteWithApproval(BORROWER_DELETE);
  const pending = pendingByEntityId.get(borrowerId);

  const startDelete = async () => {
    if (pending) {
      return showPendingBorrowerDeletion(pending, borrower, {
        onView: () => router.push("/approvals"),
        cancel: cancelDeletionRequest,
        refresh: refreshPending,
      });
    }
    await submitDelete({ id: borrowerId }, { onAfterRequest: refreshPending, onImmediateSuccess: () => router.push("/borrowers") });
  };

  return { pending, startDelete };
};

/** "More ▾": the borrower actions that should not sit one tap away, today Delete borrower. A native <details>. */
const BorrowerMoreMenu: React.FC<BorrowerMoreMenuProps> = ({ borrower, summaryClassName }) => {
  const menu = useRef<HTMLDetailsElement>(null);
  useDismissDetails(menu);
  const { pending, startDelete } = useDeleteBorrower(borrower);

  const handleDelete = () => {
    // Focus goes back to More, so the prompt has a visible control to hand it back to.
    closeDetails(menu.current, true);
    void startDelete();
  };

  return (
    <details
      ref={menu}
      className="group"
      // Tabbing out of the menu closes it, without moving the focus. Only when the focus went somewhere:
      // a click elsewhere is the pointerdown handler's, and Safari gives a clicked button no focus.
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (next && !event.currentTarget.contains(next)) closeDetails(event.currentTarget, false);
      }}
    >
      <summary
        aria-label="More actions"
        className={`${summaryClassName} cursor-pointer list-none group-open:border-primary group-open:text-primary [&::-webkit-details-marker]:hidden`}
      >
        More
        <ChevronDown aria-hidden="true" size={16} className="-mr-0.5 shrink-0 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" />
      </summary>

      {/* Positioned against the header's actions row: right-aligned under it and never wider than it,
          so at 360px it can not run off the screen whichever line More wraps to. */}
      <div className="absolute right-0 top-full z-10 mt-1 w-64 max-w-full overflow-hidden rounded border border-stroke bg-white py-1 shadow-default dark:border-strokedark dark:bg-boxdark">
        <button
          type="button"
          onClick={handleDelete}
          className="flex min-h-[48px] w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-medium text-danger hover:bg-danger/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-danger lg:min-h-[40px]"
        >
          <Trash2 aria-hidden="true" size={16} className="shrink-0" />
          <span className="min-w-0">
            Delete borrower
            {pending && <span className="block text-xs font-normal text-black/70 dark:text-bodydark">Already in the deletion queue</span>}
          </span>
        </button>
      </div>
    </details>
  );
};

export default BorrowerMoreMenu;
