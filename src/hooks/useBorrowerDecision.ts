"use client";

import { useCallback } from "react";
import { toast } from "react-toastify";
import BorrowerQueryMutations from "@/graphql/BorrowerQueryMutations";
import type { BorrowerDecision } from "@/utils/DataTypes";
import { GraphQLConnectionError, graphqlFetch } from "@/utils/graphqlFetch";

const SAVE_FAILED = "Could not save the decision. Please try again.";

const SAVED: Record<BorrowerDecision["status"], string> = {
  approved: "Marked Approved.",
  rejected: "Marked Rejected.",
};

// The useDeletionRequests pattern: surface a GraphQL error as a toast, tell the caller to bail.
// The server's messages are client-safe ("Write why the borrower is rejected.", "Borrower not found.").
const reportGqlError = (r: { errors?: Array<{ message: string }> }): boolean => {
  if (r.errors?.length) {
    toast.error(r.errors[0].message || SAVE_FAILED);
    return true;
  }
  return false;
};

/**
 * Approve or reject a borrower (setBorrowerDecision). `decide` toasts the outcome and returns the
 * saved decision, or null when nothing was saved (the toast has already said why). Logs carry the
 * borrower id and the status only, never the reason: it may name personal circumstances.
 */
export const useBorrowerDecision = () => {
  const decide = useCallback(
    async (
      borrowerId: number,
      status: BorrowerDecision["status"],
      reason: string | null,
    ): Promise<BorrowerDecision | null> => {
      try {
        const r = await graphqlFetch<{ setBorrowerDecision: BorrowerDecision | null }>(
          BorrowerQueryMutations.SET_BORROWER_DECISION_MUTATION,
          // Blank is no reason: the server treats it the same, and it is optional for approved.
          { borrower_id: borrowerId, status, reason: reason?.trim() || null },
        );
        if (reportGqlError(r)) return null;
        const decision = r.data?.setBorrowerDecision ?? null;
        if (!decision) {
          console.error("[useBorrowerDecision] the server answered with no decision", { borrowerId, status });
          toast.error(SAVE_FAILED);
          return null;
        }
        toast.success(SAVED[status]);
        return decision;
      } catch (error) {
        // graphqlFetch's own errors (no connection, a server error page) carry a message fit to show.
        console.error("[useBorrowerDecision] the decision did not save", { borrowerId, status, error });
        toast.error(error instanceof GraphQLConnectionError ? error.message : SAVE_FAILED);
        return null;
      }
    },
    [],
  );

  return { decide };
};

export default useBorrowerDecision;
