"use client"

import { useCallback, useEffect, useRef, useState } from 'react';
import GeneralJournalQueryMutations from '@/graphql/GeneralJournalQueryMutations';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { usePagination } from './usePagination';

const useGeneralJournal = (journalType: string = 'CRJ') => {
  const { GET_GJ_QUERY } = GeneralJournalQueryMutations;

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    branch_id: '',
    branch_sub_id: '',
  });

  // Wrapper function for usePagination hook
  const fetchJournalForPagination = useCallback(async (
    first: number,
    page: number,
    search?: string
  ) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_GJ_QUERY,
        variables: {
          first,
          page,
          ...(search && { search }),
          orderBy: [{ column: "id", order: 'DESC' }],
          input: {
            branch_id: filters.branch_id,
            branch_sub_id: filters.branch_sub_id,
            startDate: filters.startDate,
            endDate: filters.endDate,
            j_type: journalType,
          }
        },
      }),
    });

    const result = await response.json();

    return {
      data: result.data.getJournal.data,
      paginatorInfo: result.data.getJournal.paginatorInfo || {
        total: result.data.getJournal.data.length,
        currentPage: page,
        lastPage: 1,
        hasMorePages: false,
      }
    };
  }, [GET_GJ_QUERY, journalType, filters]);

  const {
    data: dataGj,
    loading,
    error,
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
    canGoNext,
    canGoPrevious,
  } = usePagination<RowAcctgEntry>({
    fetchFunction: fetchJournalForPagination,
    config: {
      initialPageSize: 20,
    },
  });

  // Auto-refresh on filter change. usePagination only auto-refreshes on
  // search/status, so we fire goToPage(1) when filters change. Skip the
  // very first render because usePagination already fires an initial fetch.
  const isFirstFilterRun = useRef(true);
  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Server-side pagination props for CustomDatatable
  const serverSidePaginationProps = {
    totalRecords: pagination.totalRecords,
    currentPage: pagination.currentPage,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
    hasNextPage: pagination.hasNextPage,
    hasPreviousPage: pagination.hasPreviousPage,
    onPageChange: goToPage,
    onPageSizeChange: changePageSize,
    searchQuery,
    onSearchChange: setSearchQuery,
    pageSizeOptions: [10, 20, 50, 100],
  };

  return {
    dataGj,
    loading,
    error,
    refresh,
    filters,
    setFilters,
    serverSidePaginationProps,
  };
};

export default useGeneralJournal;
