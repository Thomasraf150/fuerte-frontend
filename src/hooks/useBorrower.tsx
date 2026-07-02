"use client"

import { useCallback } from 'react';
import BorrowerQueryMutations from '@/graphql/BorrowerQueryMutations';
import { useDeleteWithApproval } from '@/hooks/useDeleteWithApproval';
import { usePagination } from './usePagination';
import useBorrowerBase from './useBorrowerBase';
import { graphqlFetch } from '@/utils/graphqlFetch';

import { BorrowerInfo, BorrowerRowInfo } from '@/utils/DataTypes';
import { toast } from "react-toastify";

/**
 * Hook for borrower list page operations
 * Extends useBorrowerBase with pagination and delete functionality
 */
const useBorrower = () => {
  const { GET_BORROWER_QUERY, DELETE_BORROWER_MUTATION } = BorrowerQueryMutations;

  const {
    borrowerLoading,
    dataChief,
    dataArea,
    dataSubArea,
    dataBorrCompany,
    submitBorrower,
    fetchDataChief,
    fetchDataArea,
    fetchDataSubArea,
    fetchDataBorrCompany,
  } = useBorrowerBase();

  // Wrapper function to adapt existing API for usePagination hook
  const fetchBorrowersForPagination = useCallback(async (
    first: number,
    page: number,
    search?: string
  ) => {
    const result = await graphqlFetch(GET_BORROWER_QUERY, {
      first,
      page,
      ...(search && { search }),
      orderBy: [{ column: "id", order: 'DESC' }]
    });

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error occurred');
    }

    if (!result.data || !result.data.getBorrowers) {
      // A well-formed GraphQL envelope whose getBorrowers field is null. Transient
      // 5xx/HTML/maintenance bodies are already caught upstream by graphqlFetch's
      // parseGraphQLResponse guard with an honest, status-specific message, so this
      // only fires on a true null field. Give the same honest copy rather than the
      // misleading "check if API is running" (the API is reachable — it answered).
      throw new Error('The server returned no borrower data (the getBorrowers field was null). Please retry; if it persists, report it to your administrator.');
    }

    return {
      data: result.data.getBorrowers.data,
      paginatorInfo: result.data.getBorrowers.paginatorInfo || {
        total: result.data.getBorrowers.data.length,
        currentPage: page,
        lastPage: 1,
        hasMorePages: false,
      }
    };
  }, [GET_BORROWER_QUERY]);

  // Use the pagination hook
  const {
    data: dataBorrower,
    loading: paginationLoading,
    error: borrowerError,
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
    canGoNext,
    canGoPrevious,
  } = usePagination<BorrowerRowInfo>({
    fetchFunction: fetchBorrowersForPagination,
    config: { initialPageSize: 20 },
  });

  // Legacy fetchDataBorrower function for backward compatibility
  const fetchDataBorrower = useCallback(async (first: number, page: number) => {
    return await fetchBorrowersForPagination(first, page);
  }, [fetchBorrowersForPagination]);

  /**
   * Submit borrower with automatic list refresh
   */
  const onSubmitBorrower = async (data: BorrowerInfo): Promise<{ success: boolean; error?: string; data?: any }> => {
    return submitBorrower(data, refresh);
  };

  /**
   * Delete a borrower. Bypass-eligible roles (ADMIN/OWNER/BRANCH_ADMIN)
   * soft-delete immediately; everyone else files a request. The shared
   * `useDeleteWithApproval` hook handles the spinner / branching / errors.
   */
  const submitDeleteBorrower = useDeleteWithApproval<{ id: string | number }>({
    mutation: DELETE_BORROWER_MUTATION,
    responseKey: 'deleteBorrower',
    promptTitle: 'Delete this borrower?',
    promptText: 'If you are an admin or owner, this happens immediately. Otherwise a branch admin will review your request.',
    buildVariables: (args, reason) => ({ id: args.id, reason }),
    errorLabel: 'Failed to delete borrower',
  });

  const handleRmBorrower = async (
    data: any,
    onAfterRequest?: () => Promise<void> | void,
  ) => {
    await submitDeleteBorrower(
      { id: data.id },
      { onAfterRequest, onImmediateSuccess: refresh }
    );
  };

  return {
    // Legacy data and functions (for backward compatibility)
    dataChief,
    dataArea,
    dataSubArea,
    fetchDataSubArea,
    dataBorrCompany,
    onSubmitBorrower,
    dataBorrower,
    borrowerLoading,
    paginationLoading,
    fetchDataBorrower,
    fetchDataChief,
    fetchDataArea,
    fetchDataBorrCompany,
    handleRmBorrower,

    // Pagination functionality
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
    canGoNext,
    canGoPrevious,
    borrowerError,

    // Server-side pagination helpers for CustomDatatable
    serverSidePaginationProps: {
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
      recordType: 'borrower',
      recordTypePlural: 'borrowers',
    },
  };
};

export default useBorrower;
