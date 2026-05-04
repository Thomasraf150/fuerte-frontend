"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/store";
import ProblemAccountsQueryMutation from "@/graphql/ProblemAccountsQueryMutation";

export interface ProblemAccountRow {
  loan_id: string;
  loan_ref: string;
  borrower_name: string;
  branch_name: string | null;
  sub_branch_name: string | null;
  pn_amount: string;
  cumulative_scheduled: string;
  cumulative_collected: string;
  ua_amount: string;
  sp_amount: string;
  shortfall: string;
  oldest_unpaid_due_date: string | null;
  oldest_unpaid_schedule_id: string | null;
  days_past_due: number;
}

export interface ProblemAccountSummary {
  total_problem_accounts: number;
  total_shortfall: string;
  total_ua_amount: string;
  total_sp_amount: string;
}

export interface ProblemAccountFilters {
  branchId?: string;
  branchSubId?: string;
  searchTerm?: string;
  sortBy?: string;
  graceDays?: number;
}

const EMPTY_SUMMARY: ProblemAccountSummary = {
  total_problem_accounts: 0,
  total_shortfall: "0.00",
  total_ua_amount: "0.00",
  total_sp_amount: "0.00",
};

export function useProblemAccountsPaginated(initialFilters: ProblemAccountFilters = {}) {
  const [data, setData] = useState<ProblemAccountRow[]>([]);
  const [summary, setSummary] = useState<ProblemAccountSummary>(EMPTY_SUMMARY);
  const [filters, setFiltersState] = useState<ProblemAccountFilters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { GET_PROBLEM_ACCOUNTS } = ProblemAccountsQueryMutation;
  const initialized = useRef(false);

  const fetchPage = useCallback(
    async (page: number, size: number, currentFilters: ProblemAccountFilters) => {
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const token = GET_AUTH_TOKEN();
      if (!token) {
        setError("Authentication required");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: GET_PROBLEM_ACCOUNTS,
            variables: {
              input: {
                branchId: currentFilters.branchId || null,
                branchSubId: currentFilters.branchSubId || null,
                searchTerm: currentFilters.searchTerm || null,
                sortBy: currentFilters.sortBy || "shortfall_desc",
                graceDays: currentFilters.graceDays ?? 0,
                page,
                perPage: size,
              },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message || "GraphQL error");
        }

        const payload = result.data?.getProblemAccounts;
        if (!payload) {
          throw new Error("Empty response");
        }

        setData(payload.data ?? []);
        setSummary(payload.summary ?? EMPTY_SUMMARY);
        setTotalRecords(payload.pagination?.totalRecords ?? 0);
        setTotalPages(
          size > 0
            ? Math.max(1, Math.ceil((payload.pagination?.totalRecords ?? 0) / size))
            : 1
        );
        setCurrentPage(page);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load problem accounts";
        setError(msg);
        setData([]);
        setSummary(EMPTY_SUMMARY);
      } finally {
        setLoading(false);
      }
    },
    [GET_PROBLEM_ACCOUNTS]
  );

  const setFilters = useCallback(
    (next: ProblemAccountFilters) => {
      setFiltersState(next);
      fetchPage(1, pageSize, next);
    },
    [fetchPage, pageSize]
  );

  const goToPage = useCallback(
    (page: number) => {
      fetchPage(page, pageSize, filters);
    },
    [fetchPage, filters, pageSize]
  );

  const changePageSize = useCallback(
    (size: number) => {
      setPageSize(size);
      fetchPage(1, size, filters);
    },
    [fetchPage, filters]
  );

  const refresh = useCallback(() => {
    fetchPage(currentPage, pageSize, filters);
  }, [fetchPage, currentPage, pageSize, filters]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      fetchPage(1, pageSize, initialFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    summary,
    filters,
    loading,
    error,
    currentPage,
    pageSize,
    totalRecords,
    totalPages,
    setFilters,
    goToPage,
    changePageSize,
    refresh,
    serverSidePaginationProps: {
      totalRecords,
      currentPage,
      pageSize,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      onPageChange: goToPage,
      onPageSizeChange: changePageSize,
      pageSizeOptions: [10, 20, 50, 100],
      enableSearch: false,
      recordType: "problem account",
      recordTypePlural: "problem accounts",
    },
  };
}
