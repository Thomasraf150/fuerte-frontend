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
} = DeletionRequestsQueryMutation;

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
  };
};

export default useDeletionRequests;
