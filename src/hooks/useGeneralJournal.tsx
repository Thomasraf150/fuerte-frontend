"use client"

import { useCallback } from 'react';
import GeneralJournalQueryMutations from '@/graphql/GeneralJournalQueryMutations';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { usePagination } from './usePagination';

const useGeneralJournal = (journalType: string = 'CRJ') => {
  const { GET_GJ_QUERY } = GeneralJournalQueryMutations;

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
            branch_sub_id: '',
            startDate: '',
            endDate: '',
            j_type: journalType
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
  }, [GET_GJ_QUERY, journalType]);

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
    serverSidePaginationProps,
  };
};

export default useGeneralJournal;
