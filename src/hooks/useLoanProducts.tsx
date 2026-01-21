"use client"

import { useEffect, useState, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import LoanProductsQueryMutations from '@/graphql/LoanProductsQueryMutations';
import { DataRowLoanProducts, DataFormLoanProducts } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import { usePagination } from './usePagination';

const useLoanProducts = () => {
  const { GET_LOAN_PRODUCT_QUERY, SAVE_LOAN_PRODUCT_QUERY, UPDATE_LOAN_PRODUCT_QUERY } = LoanProductsQueryMutations;
  const [loanProductLoading, setLoanProductLoading] = useState<boolean>(false);

  // Wrapper function to adapt existing API for usePagination hook
  const fetchLoanProductsForPagination = useCallback(async (
    first: number,
    page: number,
    search?: string
  ) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_LOAN_PRODUCT_QUERY,
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Check for GraphQL errors
      if (result.errors) {
        const errorMessage = result.errors.map((err: any) => err.message).join(', ');
        throw new Error(`GraphQL error: ${errorMessage}`);
      }

      // Check if result.data exists and has the expected structure
      if (!result.data) {
        throw new Error('No data received from server');
      }

      if (!result.data.getLoanProducts) {
        throw new Error('getLoanProducts field not found in response');
      }

      const loanProductsData = result.data.getLoanProducts;

      // Handle both paginated and non-paginated responses for backwards compatibility
      let data, paginatorInfo;
      
      if (Array.isArray(loanProductsData)) {
        // Legacy format: direct array
        data = loanProductsData;
        paginatorInfo = {
          total: loanProductsData.length,
          currentPage: page,
          lastPage: 1,
          hasMorePages: false,
        };
      } else {
        // New paginated format
        data = loanProductsData.data || [];
        paginatorInfo = loanProductsData.paginatorInfo || {
          total: data.length,
          currentPage: page,
          lastPage: 1,
          hasMorePages: false,
        };
      }

      // Return the expected format for usePagination
      return {
        data,
        paginatorInfo
      };

    } catch (error) {
      console.error('Error fetching loan products:', error);
      throw error;
    }
  }, [GET_LOAN_PRODUCT_QUERY]);

  // Use the new pagination hook
  const {
    data: dataLoanProducts,
    loading: loanProductsLoading,
    error: loanProductsError,
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
    canGoNext,
    canGoPrevious,
  } = usePagination<DataRowLoanProducts>({
    fetchFunction: fetchLoanProductsForPagination,
    config: {
      initialPageSize: 20,
    },
  });

  // Legacy fetchLoanProducts function for backward compatibility
  const fetchLoanProducts = useCallback(async (orderBy = 'id_desc') => {
    const result = await fetchLoanProductsForPagination(20, 1);
    // This maintains the old behavior for any existing code that still uses it
    return result;
  }, [fetchLoanProductsForPagination]);

  const onSubmitLoanProduct = async (data: DataFormLoanProducts) => {
    setLoanProductLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];

      let mutation;
      let variables: { input: any } = {
        input: {
          loan_code_id: Number(data.loan_code_id),
          description: data.description,
          terms: Number(data.terms),
          interest_rate: Number(data.interest_rate),
          udi: Number(data.udi),
          processing: Number(data.processing),
          agent_fee: Number(data.agent_fee),
          insurance: Number(data.insurance),
          insurance_fee: Number(data.insurance_fee),
          collection: Number(data.collection),
          notarial: Number(data.notarial),
          // addon: Number(data.addon),
          base_deduction: Number(data.base_deduction),
          addon_terms: Number(data.addon_terms),
          addon_udi_rate: Number(data.addon_udi_rate),
          is_active: data.is_active,
          user_id: userData?.user?.id
        },
      };

      if (data.id) {
        mutation = UPDATE_LOAN_PRODUCT_QUERY;
        variables.input.id = data.id;
    } else {
      mutation = SAVE_LOAN_PRODUCT_QUERY;
    }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: mutation,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Handle GraphQL errors
      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for successful loan product save
      if (result.data?.saveLoanProduct || result.data?.updateLoanProduct) {
        toast.success('Loan Product Saved!');
        refresh(); // Refresh the paginated data after successful save
        return { success: true, data: result.data };
      }

      toast.success('Loan Product Saved!');
      refresh();
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoanProductLoading(false);
    }
  };

  // Note: Pagination hook automatically handles initial data loading
  // No manual useEffect needed for fetching data

  return {
    // Legacy API for backward compatibility
    data: dataLoanProducts,
    loading: loanProductsLoading,
    fetchLoanProducts,
    onSubmitLoanProduct,
    loanProductLoading,

    // New pagination functionality
    dataLoanProducts,
    loanProductsLoading,
    loanProductsError,
    refresh,
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

export default useLoanProducts;