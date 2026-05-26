"use client"

import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import GeneralVoucherQueryMutations from '@/graphql/GeneralVoucherQueryMutations';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';
import { fetchWithRecache } from '@/utils/helper';
import { usePagination } from './usePagination';
import { useDownloadPdf } from '@/hooks/useDownloadPdf';
import { graphqlFetch } from '@/utils/graphqlFetch';

const useGeneralVoucher = () => {

  const { CREATE_GV_MUTATION, UPDATE_GV_MUTATION, GET_GV_QUERY, PRINT_CV_MUTATION, EXPORT_CV_TO_EXCEL_MUTATION } = GeneralVoucherQueryMutations;

  const [generalVoucherLoading, setGeneralVoucherLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  // Print state owned by the shared useDownloadPdf hook so every PDF feature
  // shares one consistent flow + loader UI.
  const { download: downloadPdf, printing: printLoading } = useDownloadPdf();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    branch_id: '',
    branch_sub_id: '',
  });
  const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
  const userData = JSON.parse(storedAuthStore)['state'];

  // Wrapper function to adapt existing API for usePagination hook
  const fetchGeneralVoucherForPagination = useCallback(async (
    first: number,
    page: number,
    search?: string
  ) => {
    const result = await graphqlFetch(GET_GV_QUERY, {
      first,
      page,
      ...(search && { search }), // Add search parameter if provided
      orderBy: [
        { column: "id", order: 'DESC' }
      ],
      input: {
        branch_id: filters.branch_id,
        branch_sub_id: filters.branch_sub_id,
        startDate: filters.startDate,
        endDate: filters.endDate,
      }
    });

    // Surface GraphQL/server errors as a real Error instead of crashing on
    // result.data being undefined (which hides the actual message in DevTools).
    if (result.errors?.length) {
      throw new Error(result.errors[0].message || 'GraphQL error');
    }
    if (!result.data?.getCheckVoucher) {
      throw new Error('getCheckVoucher returned no data — backend schema may be out of sync. Clear Lighthouse cache.');
    }

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
  }, [GET_GV_QUERY, filters]);

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
    },
  });

  // Auto-refresh the voucher list whenever filters change.
  // usePagination only auto-refreshes on search/status changes, so we trigger
  // a re-fetch here on filter changes. We use goToPage(1) instead of refresh()
  // because goToPage closes over the freshest fetchData (refresh has a stale-
  // closure issue with the wrapped fetchFunction). Resetting to page 1 on
  // filter change is also the expected UX. First mount is skipped because
  // usePagination already fires an initial fetch.
  const isFirstFilterRun = useRef(true);
  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Backward-compat: existing forms call setDateFilters({ startDate, endDate })
  const setDateFilters = (val: { startDate: string; endDate: string }) => {
    setFilters(prev => ({ ...prev, startDate: val.startDate, endDate: val.endDate }));
  };

  // Legacy fetchGV function for backward compatibility (called by CV/JV forms after save)
  const fetchGV = async (_branch_sub_id: string, startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
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

      const result = await graphqlFetch(mutation, variables);

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
      let mutation;
      let variables: { input: any } = {
        input: {
          id: row?.id,
          journal_date,
          journal_desc: row?.journal_desc ?? '',
        },
      };

      mutation = UPDATE_GV_MUTATION;

      const result = await graphqlFetch(mutation, variables);

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
    await downloadPdf({
      query: PRINT_CV_MUTATION,
      variables: { input: { journal_ref } },
      extractUrl: (data) => data?.printAcctgEntries,
      loadingTitle: 'Generating Voucher PDF…',
      successMessage: 'Voucher PDF generated successfully!',
      errorMessage: 'Failed to generate voucher PDF.',
    });
  };

  const exportCheckVouchersToExcel = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.warning('Please select a date range before exporting.');
      return;
    }

    setExportLoading(true);
    try {
      const result = await graphqlFetch(EXPORT_CV_TO_EXCEL_MUTATION, {
        input: {
          branch_id: filters.branch_id,
          branch_sub_id: filters.branch_sub_id,
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      });

      if (result.errors?.length) {
        console.error('[ExportCV] GraphQL errors:', result.errors);
        toast.error(result.errors[0].message || 'Failed to generate Excel file');
        return;
      }

      const xlsxPath = result.data?.exportCheckVouchers;
      if (!xlsxPath || typeof xlsxPath !== 'string') {
        toast.error('Excel export failed: invalid response from server.');
        return;
      }

      // Trigger download via hidden link — works in modern browsers without
      // popup-blocker headaches and avoids leaving a stale tab open.
      const fullUrl = process.env.NEXT_PUBLIC_BASE_URL + xlsxPath;
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Check vouchers exported to Excel successfully!', { autoClose: 3000 });
    } catch (error) {
      console.error('[ExportCV] Export failed:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(`Failed to export check vouchers: ${message}`);
    } finally {
      setExportLoading(false);
    }
  };

  return {
    // Legacy data and functions (for backward compatibility)
    createGV,
    updateGV,
    fetchGV,
    dataGV,
    printSummaryTicketDetails,
    printLoading,
    exportCheckVouchersToExcel,
    exportLoading,
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
    filters,
    setFilters,

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