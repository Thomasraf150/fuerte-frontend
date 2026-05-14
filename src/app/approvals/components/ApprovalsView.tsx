"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Inbox } from "react-feather";
import { useAuthStore } from "@/store";
import useDeletionRequests, {
  DeletionRequest,
  DeletionRequestStatus,
} from "@/hooks/useDeletionRequests";
import DeletionRequestCard from "./DeletionRequestCard";
import "../styles.css";

type Tab = "pending" | "mine" | "all";

const ROLE_NAME = (user: any): string => {
  if (!user) return "";
  if (typeof user?.role?.name === "string") return user.role.name;
  if (Array.isArray(user?.roles) && user.roles[0]?.name) return user.roles[0].name;
  return "";
};

const IS_APPROVER_ROLE = (roleName: string): boolean => {
  const r = (roleName || "").toUpperCase();
  return r === "ADMIN" || r === "OWNER" || r === "BRANCH_ADMIN";
};

const ApprovalsView: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const userId = user?.id;
  const roleName = ROLE_NAME(user);
  const isApprover = IS_APPROVER_ROLE(roleName);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    setUser(useAuthStore.getState().user);
    const unsub = useAuthStore.subscribe((s) => setUser(s.user));
    return () => unsub();
  }, []);

  const [tab, setTab] = useState<Tab>("mine");
  useEffect(() => {
    if (isApprover) setTab((t) => (t === "mine" ? "pending" : t));
  }, [isApprover]);

  const [allFilter, setAllFilter] = useState<DeletionRequestStatus | "">("");

  const {
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
  } = useDeletionRequests();

  const refresh = async () => {
    if (tab === "pending") return fetchPendingForMe();
    // "Requests" only shows in-flight work — decided requests move to
    // All decisions (approvers) or fall off the user's view entirely.
    if (tab === "mine") return fetchMyRequests("pending");
    return fetchAllRequests(allFilter || undefined);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, allFilter]);

  // Prefetch every dataset on mount (and when the user's approver status
  // first resolves) so the stat strip and tab counters are accurate from
  // the moment the page renders. Otherwise "All decisions" would tick
  // from 0 to N a moment after first paint.
  useEffect(() => {
    fetchPendingForMe();
    fetchMyRequests("pending");
    if (isApprover) {
      fetchAllRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApprover]);

  const current: DeletionRequest[] =
    tab === "pending" ? pendingForMe : tab === "mine" ? myRequests : allRequests;

  const pendingCount = pendingForMe.length;
  const decidedToday = allRequests.filter(
    (r) => r.decided_at && r.decided_at.slice(0, 10) === today
  ).length;
  const branchOpen = myRequests.filter((r) => r.status === "pending").length;

  // A decision changes more than just the active tab's dataset — it also
  // affects every counter on the page (pending-for-me, branch-open,
  // decided-today, tab counts). Refresh all three datasets in parallel
  // so every number on the screen stays in sync without a manual reload.
  const refreshAll = async () => {
    await Promise.all([
      fetchPendingForMe(),
      fetchMyRequests("pending"),
      isApprover ? fetchAllRequests(allFilter || undefined) : Promise.resolve(),
    ]);
  };

  const onApprove = async (id: string, note: string) => {
    const ok = await approve(id, note);
    if (ok) await refreshAll();
  };
  const onReject = async (id: string, note: string) => {
    const ok = await reject(id, note);
    if (ok) await refreshAll();
  };
  const onCancel = async (id: string) => {
    const ok = await cancel(id);
    if (ok) await refreshAll();
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-7 py-4 dark:border-strokedark flex items-center justify-between">
        <h3 className="font-medium text-black dark:text-white">Deletion Approvals</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          A record of requested deletions awaiting decision.
        </span>
      </div>

      <div className="p-7">
        {/* stat strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="appr-stat-card">
            <div className="appr-stat-label">Pending · for me</div>
            <div className={`appr-stat-value ${pendingCount > 0 ? "is-amber" : ""}`}>
              {String(pendingCount).padStart(2, "0")}
            </div>
          </div>
          <div className="appr-stat-card">
            <div className="appr-stat-label">Branch open requests</div>
            <div className="appr-stat-value">{String(branchOpen).padStart(2, "0")}</div>
          </div>
          <div className="appr-stat-card">
            <div className="appr-stat-label">Decided today</div>
            <div className="appr-stat-value is-green">{String(decidedToday).padStart(2, "0")}</div>
          </div>
          <div className="appr-stat-card">
            <div className="appr-stat-label">Your role</div>
            <div className="appr-stat-value is-text is-blue">{roleName || "—"}</div>
          </div>
        </div>

        {/* tabs */}
        <nav
          className="flex items-center gap-6 border-b border-stroke dark:border-strokedark mb-5"
          aria-label="Approval views"
        >
          {isApprover && (
            <button
              className={`appr-tab ${tab === "pending" ? "is-active" : ""}`}
              onClick={() => setTab("pending")}
            >
              Pending for me
              <span className="appr-tab-count">{pendingForMe.length}</span>
            </button>
          )}
          <button
            className={`appr-tab ${tab === "mine" ? "is-active" : ""}`}
            onClick={() => setTab("mine")}
          >
            Requests
            <span className="appr-tab-count">{myRequests.length}</span>
          </button>
          {isApprover && (
            <button
              className={`appr-tab ${tab === "all" ? "is-active" : ""}`}
              onClick={() => setTab("all")}
            >
              All decisions
            </button>
          )}
        </nav>

        {/* status filter (All tab only, approvers only) */}
        {tab === "all" && isApprover && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(["", "pending", "approved", "rejected", "cancelled", "superseded"] as Array<
              "" | DeletionRequestStatus
            >).map((s) => {
              const active = allFilter === s;
              return (
                <button
                  key={s || "any"}
                  type="button"
                  onClick={() => setAllFilter(s as any)}
                  className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                    active
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 dark:bg-transparent dark:text-slate-300 dark:border-slate-600 dark:hover:border-slate-400"
                  }`}
                >
                  {s ? s.charAt(0).toUpperCase() + s.slice(1) : "Any"}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-10">Loading…</div>
        ) : current.length === 0 ? (
          <div className="appr-empty">
            <Inbox size={36} className="appr-empty-icon mx-auto" />
            <div className="appr-empty-title">
              {tab === "pending"
                ? "No requests waiting on you."
                : tab === "mine"
                ? "No open requests in your branch."
                : "Nothing in the ledger for this filter."}
            </div>
            <div className="appr-empty-text">
              {tab === "pending"
                ? "When a branch user requests a deletion, it lands here for your review."
                : tab === "mine"
                ? "When you or anyone in your branch submits a deletion, it appears here."
                : "Adjust the status filter to see more."}
            </div>
          </div>
        ) : (
          <div>
            {current.map((req) => (
              <DeletionRequestCard
                key={req.id}
                request={req}
                canDecide={isApprover && req.requested_by_user_id !== userId}
                canCancel={req.requested_by_user_id === userId}
                onApprove={onApprove}
                onReject={onReject}
                onCancel={onCancel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalsView;
