"use client"

import { useCallback } from 'react';
import BorrowerQueryMutations from '@/graphql/BorrowerQueryMutations';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { useAuthStore } from "@/store";
import { usePagination } from './usePagination';
import useBorrowerBase from './useBorrowerBase';

import { BorrowerInfo, BorrowerRowInfo } from '@/utils/DataTypes';
import { toast } from "react-toastify";

/**
 * Hook for borrower list page operations
 * Extends useBorrowerBase with pagination and delete functionality
 */
const useBorrower = () => {
  const { GET_AUTH_TOKEN } = useAuthStore.getState();
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_BORROWER_QUERY,
        variables: {
          first,
          page,
          ...(search && { search }),
          orderBy: [{ column: "id", order: 'DESC' }]
        },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error occurred');
    }

    if (!result.data || !result.data.getBorrowers) {
      throw new Error('No data returned from server - check if API is running');
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
   * Delete a borrower with confirmation
   */
  const handleRmBorrower = async (data: any) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You are deleting this borrower',
      'Confirm',
    );
    if (!isConfirmed) return;

    try {
      const token = GET_AUTH_TOKEN();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: DELETE_BORROWER_MUTATION,
          variables: { id: data.id }
        }),
      });

      const result = await response.json();

      if (result.errors) {
        toast.error(result.errors[0].message);
        return;
      }

      if (result.data?.deleteBorrower?.status) {
        refresh();
        toast.success(result.data.deleteBorrower.message);
      } else {
        toast.error(result.data?.deleteBorrower?.message || 'Failed to delete borrower');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
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
