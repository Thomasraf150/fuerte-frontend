"use client";

import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import DeletionRequestsQueryMutation from "@/graphql/DeletionRequestsQueryMutation";

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

const {
  PENDING_DELETION_REQUESTS_FOR_ME,
  MY_DELETION_REQUESTS,
  ALL_DELETION_REQUESTS,
  APPROVE_DELETION_REQUEST,
  REJECT_DELETION_REQUEST,
  CANCEL_DELETION_REQUEST,
} = DeletionRequestsQueryMutation;

async function post<T = any>(query: string, variables: Record<string, unknown> = {}, token: string | null | undefined): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

export const useDeletionRequests = () => {
  const [loading, setLoading] = useState(false);
  const [pendingForMe, setPendingForMe] = useState<DeletionRequest[]>([]);
  const [myRequests, setMyRequests] = useState<DeletionRequest[]>([]);
  const [allRequests, setAllRequests] = useState<DeletionRequest[]>([]);

  const token = useAuthStore.getState().GET_AUTH_TOKEN();

  const fetchPendingForMe = useCallback(async () => {
    setLoading(true);
    try {
      const r = await post(PENDING_DELETION_REQUESTS_FOR_ME, {}, token);
      if (r.errors) {
        toast.error(r.errors[0].message);
        return;
      }
      setPendingForMe(r.data?.pendingDeletionRequestsForMe ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMyRequests = useCallback(async (status?: DeletionRequestStatus) => {
    setLoading(true);
    try {
      const r = await post(MY_DELETION_REQUESTS, status ? { status } : {}, token);
      if (r.errors) {
        toast.error(r.errors[0].message);
        return;
      }
      setMyRequests(r.data?.myDeletionRequests ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAllRequests = useCallback(async (status?: DeletionRequestStatus, branch_sub_id?: number) => {
    setLoading(true);
    try {
      const vars: Record<string, unknown> = {};
      if (status) vars.status = status;
      if (branch_sub_id) vars.branch_sub_id = branch_sub_id;
      const r = await post(ALL_DELETION_REQUESTS, vars, token);
      if (r.errors) {
        toast.error(r.errors[0].message);
        return;
      }
      setAllRequests(r.data?.allDeletionRequests ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const approve = useCallback(async (id: string, note?: string) => {
    const r = await post(APPROVE_DELETION_REQUEST, { id, note: note || null }, token);
    if (r.errors) {
      toast.error(r.errors[0].message);
      return false;
    }
    toast.success("Deletion approved.");
    return true;
  }, [token]);

  const reject = useCallback(async (id: string, note?: string) => {
    const r = await post(REJECT_DELETION_REQUEST, { id, note: note || null }, token);
    if (r.errors) {
      toast.error(r.errors[0].message);
      return false;
    }
    toast.success("Request rejected.");
    return true;
  }, [token]);

  const cancel = useCallback(async (id: string) => {
    const r = await post(CANCEL_DELETION_REQUEST, { id }, token);
    if (r.errors) {
      toast.error(r.errors[0].message);
      return false;
    }
    toast.success("Request cancelled.");
    return true;
  }, [token]);

  return {
    loading,
    pendingForMe,
    myRequests,
    allRequests,
    fetchPendingForMe,
    fetchMyRequests,
    fetchAllRequests,
    approve,
    reject,
    cancel,
  };
};

export default useDeletionRequests;
