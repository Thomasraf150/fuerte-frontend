"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/store";
import RenewableBorrowersQueryMutation from "@/graphql/RenewableBorrowersQueryMutation";
import { graphqlFetch } from "@/utils/graphqlFetch";

export interface RenewableBorrowerRow {
  borrower_id: string;
  borrower_name: string;
  branch_name: string | null;
  sub_branch_name: string | null;
  renewable_loan_count: number;
  total_pn_amount: string;
  latest_released_date: string | null;
  is_problem: boolean;
  problem_cutoffs: number;
  problem_shortfall: string;
}

export interface RenewableBorrowerSummary {
  total_renewable_borrowers: number;
  total_problem_on_page: number;
}

export interface RenewableBorrowerFilters {
  branchId?: string;
  branchSubId?: string;
  searchTerm?: string;
}

const EMPTY_SUMMARY: RenewableBorrowerSummary = {
  total_renewable_borrowers: 0,
  total_problem_on_page: 0,
};

export function useRenewableBorrowersPaginated(initialFilters: RenewableBorrowerFilters = {}) {
  const [data, setData] = useState<RenewableBorrowerRow[]>([]);
  const [summary, setSummary] = useState<RenewableBorrowerSummary>(EMPTY_SUMMARY);
  const [filters, setFiltersState] = useState<RenewableBorrowerFilters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { GET_RENEWABLE_BORROWERS } = RenewableBorrowersQueryMutation;
  const initialized = useRef(false);
  // Monotonic id so a stale out-of-order response can't overwrite fresh results.
  const latestRequestId = useRef(0);

  const fetchPage = useCallback(
    async (page: number, size: number, currentFilters: RenewableBorrowerFilters) => {
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const token = GET_AUTH_TOKEN();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const requestId = ++latestRequestId.current;
      setLoading(true);
      setError(null);

      try {
        const result = await graphqlFetch(GET_RENEWABLE_BORROWERS, {
          input: {
            branchId: currentFilters.branchId || null,
            branchSubId: currentFilters.branchSubId || null,
            searchTerm: currentFilters.searchTerm || null,
            page,
            perPage: size,
          },
        });

        if (requestId !== latestRequestId.current) return;

        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message || "GraphQL error");
        }

        const payload = result.data?.getRenewableBorrowers;
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
        if (requestId !== latestRequestId.current) return;
        const msg = e instanceof Error ? e.message : "Failed to load renewable borrowers";
        setError(msg);
        setData([]);
        setSummary(EMPTY_SUMMARY);
      } finally {
        if (requestId === latestRequestId.current) setLoading(false);
      }
    },
    [GET_RENEWABLE_BORROWERS]
  );

  const setFilters = useCallback(
    (next: RenewableBorrowerFilters) => {
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
      recordType: "renewable borrower",
      recordTypePlural: "renewable borrowers",
    },
  };
}
