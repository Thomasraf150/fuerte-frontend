"use client";

import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import DeletionRequestsQueryMutation from "@/graphql/DeletionRequestsQueryMutation";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

export type DeletionRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "superseded";

export interface DeletionRequest {
  id: string;
  entity_type: string;
  entity_id: number;
  branch_id: number | null;
  branch_sub_id: number | null;
  requested_by_user_id: number;
  reason: string | null;
  status: DeletionRequestStatus;
  decided_by_user_id: number | null;
  decided_at: string | null;
  decision_note: string | null;
  entity_snapshot: string | null;
  created_at: string;
  updated_at: string;
  requestedBy?: { id: number; name: string; email: string } | null;
  decidedBy?: { id: number; name: string; email: string } | null;
  branchSub?: { id: number; name: string; code: string } | null;
  branch?: { id: number; name: string } | null;
}

export interface DeletionPaginatorInfo {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  hasMorePages: boolean;
}

const {
  PENDING_DELETION_REQUESTS_FOR_ME,
  MY_DELETION_REQUESTS,
  ALL_DELETION_REQUESTS,
  DELETION_REQUESTS_DECIDED_TODAY_COUNT,
  APPROVE_DELETION_REQUEST,
  REJECT_DELETION_REQUEST,
  CANCEL_DELETION_REQUEST,
  APPROVE_DELETION_REQUESTS,
  REJECT_DELETION_REQUESTS,
} = DeletionRequestsQueryMutation;

export type BulkDecisionAction = "approve" | "reject";
export type DeletionBulkOutcome = "approved" | "superseded" | "rejected" | "not_decided";

export interface DeletionBulkItem {
  id: string;
  entity_type: string | null;
  outcome: DeletionBulkOutcome;
  message: string | null;
}

/** The server decides at most this many ids per call; more go in sequential calls. */
export const BULK_CHUNK_SIZE = 50;

const BULK_MUTATION: Record<BulkDecisionAction, { query: string; field: string }> = {
  approve: { query: APPROVE_DELETION_REQUESTS, field: "approveDeletionRequests" },
  reject: { query: REJECT_DELETION_REQUESTS, field: "rejectDeletionRequests" },
};

const notDecided = (ids: string[], message: string): DeletionBulkItem[] =>
  ids.map((id) => ({ id, entity_type: null, outcome: "not_decided", message }));

/**
 * One bulk call for up to BULK_CHUNK_SIZE ids. Never throws: a failed call (GraphQL error,
 * network, a non-JSON answer) marks every id in it not decided, with the reason, and an id
 * the server left out of its answer is not decided either, so it stays pending, visibly.
 */
async function sendBulkChunk(
  action: BulkDecisionAction,
  ids: string[],
  note: string
): Promise<DeletionBulkItem[]> {
  const { query, field } = BULK_MUTATION[action];
  try {
    const r = await graphqlFetch(query, { ids, note: action === "reject" ? note : note || null });
    if (r.errors?.length) {
      console.error(`[approvals] bulk ${action} failed`, { ids: ids.length, message: r.errors[0].message });
      return notDecided(ids, r.errors[0].message);
    }
    const rows: DeletionBulkItem[] = (r.data?.[field]?.results ?? []).map((row: DeletionBulkItem) => ({
      ...row,
      id: String(row.id),
    }));
    const answered = new Set(rows.map((row) => row.id));
    const missing = ids.filter((id) => !answered.has(id));
    return [...rows, ...notDecided(missing, "The server did not answer for this request.")];
  } catch (error) {
    const message = error instanceof Error ? error.message : "The request could not be sent.";
    console.error(`[approvals] bulk ${action} failed`, { ids: ids.length, message });
    return notDecided(ids, message);
  }
}

// Single place that surfaces a GraphQL error as a toast and tells the caller
// whether to bail. Keeps every fetcher/mutation guard to one readable line.
const reportGqlError = (r: { errors?: Array<{ message: string }> }): boolean => {
  if (r.errors) {
    toast.error(r.errors[0].message);
    return true;
  }
  return false;
};

export const useDeletionRequests = () => {
  const [loading, setLoading] = useState(false);
  const [pendingForMe, setPendingForMe] = useState<DeletionRequest[]>([]);
  const [myRequests, setMyRequests] = useState<DeletionRequest[]>([]);
  const [allRequests, setAllRequests] = useState<DeletionRequest[]>([]);
  const [allPaginatorInfo, setAllPaginatorInfo] = useState<DeletionPaginatorInfo | null>(null);
  const [decidedTodayCount, setDecidedTodayCount] = useState(0);

  const fetchPendingForMe = useCallback(async () => {
    setLoading(true);
    try {
      const r = await graphqlFetch(PENDING_DELETION_REQUESTS_FOR_ME, {});
      if (reportGqlError(r)) return;
      setPendingForMe(r.data?.pendingDeletionRequestsForMe ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyRequests = useCallback(async (status?: DeletionRequestStatus) => {
    setLoading(true);
    try {
      const r = await graphqlFetch(MY_DELETION_REQUESTS, status ? { status } : {});
      if (reportGqlError(r)) return;
      setMyRequests(r.data?.myDeletionRequests ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllRequests = useCallback(
    async (
      status?: DeletionRequestStatus,
      branch_sub_id?: number,
      page = 1,
      first = DEFAULT_PAGE_SIZE
    ) => {
      setLoading(true);
      try {
        const vars: Record<string, unknown> = { first, page };
        if (status) vars.status = status;
        if (branch_sub_id) vars.branch_sub_id = branch_sub_id;
        const r = await graphqlFetch(ALL_DELETION_REQUESTS, vars);
        if (reportGqlError(r)) return;
        const payload = r.data?.allDeletionRequests;
        setAllRequests(payload?.data ?? []);
        setAllPaginatorInfo(payload?.paginatorInfo ?? null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchDecidedTodayCount = useCallback(async () => {
    const r = await graphqlFetch(DELETION_REQUESTS_DECIDED_TODAY_COUNT, {});
    if (r.errors) return; // best-effort, like the bell badge — stay silent
    setDecidedTodayCount(r.data?.deletionRequestsDecidedTodayCount ?? 0);
  }, []);

  const approve = useCallback(async (id: string, note?: string) => {
    const r = await graphqlFetch(APPROVE_DELETION_REQUEST, { id, note: note || null });
    if (reportGqlError(r)) return false;
    toast.success("Deletion approved.");
    return true;
  }, []);

  const reject = useCallback(async (id: string, note?: string) => {
    const r = await graphqlFetch(REJECT_DELETION_REQUEST, { id, note: note || null });
    if (reportGqlError(r)) return false;
    toast.success("Request rejected.");
    return true;
  }, []);

  const cancel = useCallback(async (id: string) => {
    const r = await graphqlFetch(CANCEL_DELETION_REQUEST, { id });
    if (reportGqlError(r)) return false;
    toast.success("Request cancelled.");
    return true;
  }, []);

  /** Decide many requests: sequential calls of at most BULK_CHUNK_SIZE ids, results merged. */
  const decideMany = useCallback(
    async (action: BulkDecisionAction, ids: string[], note: string): Promise<DeletionBulkItem[]> => {
      const results: DeletionBulkItem[] = [];
      for (let i = 0; i < ids.length; i += BULK_CHUNK_SIZE) {
        results.push(...(await sendBulkChunk(action, ids.slice(i, i + BULK_CHUNK_SIZE), note)));
      }
      return results;
    },
    []
  );

  return {
    loading,
    pendingForMe,
    myRequests,
    allRequests,
    allPaginatorInfo,
    decidedTodayCount,
    fetchPendingForMe,
    fetchMyRequests,
    fetchAllRequests,
    fetchDecidedTodayCount,
    approve,
    reject,
    cancel,
    decideMany,
  };
};

export default useDeletionRequests;
