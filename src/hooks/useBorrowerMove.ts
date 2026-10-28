"use client";

import { useCallback, useEffect, useState } from "react";
import BorrowerMoveQueries from "@/graphql/BorrowerMoveQueries";
import { GraphQLConnectionError, graphqlFetch } from "@/utils/graphqlFetch";

export interface MoveBranch {
  id: number;
  name: string;
  group_name: string | null;
}

export interface MoveArea {
  id: number;
  name: string;
  sub_areas: Array<{ id: number; name: string }>;
}

export interface MoveHistoryLine {
  /** moved, copied_to (this record was copied elsewhere) or copied_from (this record is a copy). */
  kind: "moved" | "copied_to" | "copied_from";
  /** The other record of a copy. */
  other_borrower_id: number | null;
  from_branch: string | null;
  to_branch: string | null;
  reason: string | null;
  moved_by: string | null;
  moved_at: string | null;
  loans_moved: number;
  applications_moved: number;
}

export interface MoveOpenLoan {
  loan_id: number;
  loan_ref: string | null;
  branch_name: string | null;
  /** What is still owed, as the renewal screen counts it: a decimal string. */
  balance: string;
}

export interface MoveSummary {
  borrower_id: number;
  borrower_name: string;
  /** move: nothing in the books yet; copy: a buyout, copied as a new borrower; none: neither, see refusal. */
  mode: "move" | "copy" | "none";
  refusal: string | null;
  open_loans: MoveOpenLoan[];
  open_balance: string;
  loans_to_move: number;
  applications_to_move: number;
  current_branch: MoveBranch | null;
  destinations: MoveBranch[];
  history: MoveHistoryLine[];
}

export interface MoveInput {
  branch_sub_id: number;
  area_id: number;
  sub_area_id: number | null;
  reason: string;
}

const LOAD_FAILED = "Could not load the move screen. Please try again.";
const MOVE_FAILED = "Could not move the borrower. Please try again.";
const COPY_FAILED = "Could not copy the borrower. Please try again.";

/** The server's sentences are written for staff ("Borrower not found.", "Choose a branch you also work on."). */
const messageOf = (error: unknown, fallback: string): string =>
  error instanceof GraphQLConnectionError ? error.message : fallback;

/**
 * The Move to another branch screen: the summary (where the borrower is, what moves, where to, why
 * not), the areas of the chosen branch, and the move itself. Logs carry ids only, never the reason.
 */
export const useBorrowerMove = (borrowerId: number) => {
  const [summary, setSummary] = useState<MoveSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await graphqlFetch<{ borrowerMoveSummary: MoveSummary | null }>(BorrowerMoveQueries.BORROWER_MOVE_SUMMARY, { borrower_id: borrowerId });
      if (r.errors?.length || !r.data?.borrowerMoveSummary) {
        setLoadError(r.errors?.[0]?.message || LOAD_FAILED);
      } else {
        setSummary(r.data.borrowerMoveSummary);
      }
    } catch (error) {
      console.error("[useBorrowerMove] the summary did not load", { borrowerId, error });
      setLoadError(messageOf(error, LOAD_FAILED));
    } finally {
      setLoading(false);
    }
  }, [borrowerId]);

  useEffect(() => {
    if (Number.isInteger(borrowerId) && borrowerId > 0) void load();
    else {
      setLoadError("Borrower not found.");
      setLoading(false);
    }
  }, [borrowerId, load]);

  /** The areas of a branch the borrower may move to; throws a sentence fit to show. */
  const fetchAreas = useCallback(async (branchSubId: number, signal?: AbortSignal): Promise<MoveArea[]> => {
    const r = await graphqlFetch<{ borrowerMoveAreas: MoveArea[] | null }>(
      BorrowerMoveQueries.BORROWER_MOVE_AREAS,
      { borrower_id: borrowerId, branch_sub_id: branchSubId },
      { signal },
    );
    if (r.errors?.length) throw new Error(r.errors[0].message || LOAD_FAILED);
    return r.data?.borrowerMoveAreas ?? [];
  }, [borrowerId]);

  /** Moves the borrower. Resolves to null on success, or the sentence saying why it did not. */
  const move = useCallback(async (input: MoveInput): Promise<string | null> => {
    try {
      const r = await graphqlFetch<{ moveBorrowerBranch: MoveSummary | null }>(BorrowerMoveQueries.MOVE_BORROWER_BRANCH, {
        borrower_id: borrowerId,
        ...input,
        reason: input.reason.trim(),
      });
      if (r.errors?.length || !r.data?.moveBorrowerBranch) return r.errors?.[0]?.message || MOVE_FAILED;
      setSummary(r.data.moveBorrowerBranch);
      return null;
    } catch (error) {
      console.error("[useBorrowerMove] the move did not go through", { borrowerId, to: input.branch_sub_id, error });
      return messageOf(error, MOVE_FAILED);
    }
  }, [borrowerId]);

  /** Copies the borrower (a buyout). Resolves to the new borrower's id, or the sentence saying why not. */
  const copy = useCallback(async (input: MoveInput): Promise<{ borrowerId: number } | { refusal: string }> => {
    try {
      const r = await graphqlFetch<{ copyBorrowerToBranch: { borrower_id: number } | null }>(BorrowerMoveQueries.COPY_BORROWER_TO_BRANCH, {
        borrower_id: borrowerId,
        ...input,
        reason: input.reason.trim(),
      });
      const created = r.data?.copyBorrowerToBranch;
      if (r.errors?.length || !created) return { refusal: r.errors?.[0]?.message || COPY_FAILED };
      return { borrowerId: created.borrower_id };
    } catch (error) {
      console.error("[useBorrowerMove] the copy did not go through", { borrowerId, to: input.branch_sub_id, error });
      return { refusal: messageOf(error, COPY_FAILED) };
    }
  }, [borrowerId]);

  return { summary, loading, loadError, reload: load, fetchAreas, move, copy };
};

export default useBorrowerMove;
