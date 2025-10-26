"use client"

import { useEffect, useState, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import GeneralVoucherQueryMutations from '@/graphql/GeneralVoucherQueryMutations';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';
import { fetchWithRecache } from '@/utils/helper';
import { useAuthStore } from "@/store";
import { usePagination } from './usePagination';

const useGeneralVoucher = () => {

  const { CREATE_GV_MUTATION, UPDATE_GV_MUTATION, GET_GV_QUERY, PRINT_CV_MUTATION } = GeneralVoucherQueryMutations;

  const [generalVoucherLoading, setGeneralVoucherLoading] = useState<boolean>(false);
  const [dateFilters, setDateFilters] = useState({ startDate: '', endDate: '' });
  const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
  const userData = JSON.parse(storedAuthStore)['state'];

  // Wrapper function to adapt existing API for usePagination hook
  const fetchGeneralVoucherForPagination = useCallback(async (
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
        query: GET_GV_QUERY,
        variables: {
          first,
          page,
          ...(search && { search }), // Add search parameter if provided
          orderBy: [
            { column: "id", order: 'DESC' }
          ],
          input: {
            branch_sub_id: String(userData?.user?.branch_sub_id),
            startDate: dateFilters.startDate,
            endDate: dateFilters.endDate
          }
        },
      }),
    });

    const result = await response.json();

    // Return the expected format for usePagination
    return {
      data: result.data.getCheckVoucher.data,
      paginatorInfo: result.data.getCheckVoucher.paginatorInfo || {
        total: result.data.getCheckVoucher.data.length,
        currentPage: page,
        lastPage: 1,
        hasMorePages: false,
      }
    };
  }, [GET_GV_QUERY, userData?.user?.branch_sub_id, dateFilters]);

  // Use the new pagination hook
  const {
    data: dataGV,
    loading: paginationLoading,
    error: generalVoucherError,
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
    canGoNext,
    canGoPrevious,
  } = usePagination<RowAcctgEntry>({
    fetchFunction: fetchGeneralVoucherForPagination,
    config: {
      initialPageSize: 20,
      defaultPageSize: 20,
    },
  });

  // Legacy fetchGV function for backward compatibility
  const fetchGV = async (branch_sub_id: string, startDate: string, endDate: string) => {
    setDateFilters({ startDate, endDate });
    // Trigger refresh after date filters are updated
    setTimeout(() => refresh(), 0);
  };

  const createGV = async (row: RowAcctgEntry) => {
    setGeneralVoucherLoading(true);
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
          check_no: row?.check_no,
          journal_desc: row?.journal_desc,
          acctg_details: row?.acctg_details
        },
      };

      mutation = CREATE_GV_MUTATION;

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
      if (result?.data?.createGvEntry) {
        const responseData = result.data.createGvEntry;
        toast.success(responseData.message || "General voucher created successfully!");
        return { success: true, data: responseData };
      }

      toast.success("General voucher created successfully!");
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setGeneralVoucherLoading(false);
    }
  };
  
  const updateGV = async (row: RowAcctgEntry, journal_date: string) => {
    setGeneralVoucherLoading(true);
    try {
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      let mutation;
      let variables: { input: any } = {
        input: {
          id: row?.id,
          journal_date,
        },
      };

      mutation = UPDATE_GV_MUTATION;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GET_AUTH_TOKEN()}`,
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

      // Check for successful update
      if (result?.data?.updateGvEntry) {
        const responseData = result.data.updateGvEntry;
        toast.success(responseData.message || "General voucher updated successfully!");
        return { success: true, data: responseData };
      }

      toast.success("General voucher updated successfully!");
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setGeneralVoucherLoading(false);
    }
  };

  const printSummaryTicketDetails = async (journal_ref: string) => {
    try {
      // setSumTixLoading(true);
      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: PRINT_CV_MUTATION,
          variables: {
            input: {
              journal_ref
            },
          },
        }),
      });

      const pdfUrl = response.data.printAcctgEntries;

      // Open the generated PDF in a new tab
      window.open(process.env.NEXT_PUBLIC_BASE_URL + pdfUrl, '_blank');

      // setSumTixLoading(false);
    } catch (error) {
      console.error("Error printing loan details:", error);
      toast.error("Failed to print loan details.");
      // setSumTixLoading(false);
    }
  };

  return {
    // Legacy data and functions (for backward compatibility)
    createGV,
    updateGV,
    fetchGV,
    dataGV,
    printSummaryTicketDetails,
    generalVoucherLoading, // For form submission operations
    paginationLoading, // For table loading operations
    pubSubBrId: String(userData?.user?.branch_sub_id),

    // New pagination functionality
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
    canGoNext,
    canGoPrevious,
    generalVoucherError,
    setDateFilters,

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

export default useGeneralVoucher;