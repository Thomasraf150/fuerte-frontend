"use client"

import { useEffect, useState, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import AdjustingEntriesQueryMutations from '@/graphql/AdjustingEntriesQueryMutations';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';
import { usePagination } from './usePagination';

const useAdjustingEntries = () => {

  const { GET_AE_QUERY, CREATE_AE_MUTATION } = AdjustingEntriesQueryMutations;

  const [adjustingEntriesLoading, setAdjustingEntriesLoading] = useState<boolean>(false);

  // Wrapper function to adapt existing API for usePagination hook
  const fetchAdjustingEntriesForPagination = useCallback(async (
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
        query: GET_AE_QUERY,
        variables: {
          first,
          page,
          ...(search && { search }), // Add search parameter if provided
          orderBy: [
            { column: "id", order: 'DESC' }
          ]
        },
      }),
    });

    const result = await response.json();

    // Return the expected format for usePagination
    return {
      data: result.data.getAdjustingEntries.data,
      paginatorInfo: result.data.getAdjustingEntries.paginatorInfo || {
        total: result.data.getAdjustingEntries.data.length,
        currentPage: page,
        lastPage: 1,
        hasMorePages: false,
      }
    };
  }, [GET_AE_QUERY]);

  // Use the new pagination hook
  const {
    data: dataAe,
    loading: paginationLoading,
    error: adjustingEntriesError,
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
    canGoNext,
    canGoPrevious,
  } = usePagination<RowAcctgEntry>({
    fetchFunction: fetchAdjustingEntriesForPagination,
    config: {
      initialPageSize: 20,
    },
  });

  // Legacy fetchAe function for backward compatibility
  const fetchAe = useCallback(async (branch_sub_id: string, startDate: string, endDate: string) => {
    // For backward compatibility - if this is still used anywhere
    // This would need to be refactored if filtering by branch/date is still needed
    const result = await fetchAdjustingEntriesForPagination(20, 1);
    return result;
  }, [fetchAdjustingEntriesForPagination]);

  const createAe = async (row: RowAcctgEntry) => {
    setAdjustingEntriesLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];
      let mutation;
      let variables: { input: any } = {
        input: {
          id: row?.id,
          user_id: String(userData?.user?.id),
          journal_date: row?.journal_date,
          vendor_id: row?.vendor_id,
          journal_name: row?.journal_name,
          reference_no: row?.reference_no,
          check_no: row?.check_no,
          journal_desc: row?.journal_desc,
          acctg_details: row?.acctg_details
        },
      };

      mutation = CREATE_AE_MUTATION;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables,
        }),
      });

      const result = await response.json();

      // Handle GraphQL errors
      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for successful creation
      if (result?.data?.createAeEntry) {
        const responseData = result.data.createAeEntry;
        toast.success(responseData.message || "Adjusting entry created successfully!");
        return { success: true, data: responseData };
      }

      toast.success("Adjusting entry created successfully!");
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setAdjustingEntriesLoading(false);
    }
  };

  // Fetch data on component mount if id exists
  useEffect(() => {
    // Data fetching is now handled by usePagination hook automatically
  }, []);

  return {
    // Legacy data and functions (for backward compatibility)
    createAe,
    fetchAe,
    dataAe,
    adjustingEntriesLoading, // For form submission operations
    paginationLoading, // For table loading operations

    // New pagination functionality
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
    canGoNext,
    canGoPrevious,
    adjustingEntriesError,

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
    },
  };
};

export default useAdjustingEntries;