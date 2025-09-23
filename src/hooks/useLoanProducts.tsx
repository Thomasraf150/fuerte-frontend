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

  // Wrapper function to adapt existing API for usePagination hook
  const fetchLoanProductsForPagination = useCallback(async (
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

    const result = await response.json();

    // Return the expected format for usePagination
    return {
      data: result.data.getLoanProducts.data,
      paginatorInfo: result.data.getLoanProducts.paginatorInfo || {
        total: result.data.getLoanProducts.data.length,
        currentPage: page,
        lastPage: 1,
        hasMorePages: false,
      }
    };
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
      defaultPageSize: 20,
    },
  });

  // Legacy fetchLoanProducts function for backward compatibility
  const fetchLoanProducts = useCallback(async (orderBy = 'id_desc') => {
    const result = await fetchLoanProductsForPagination(20, 1);
    // This maintains the old behavior for any existing code that still uses it
    return result;
  }, [fetchLoanProductsForPagination]);

  const onSubmitLoanProduct = async (data: DataFormLoanProducts) => {
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
    const result = await response.json();
    if (result.errors) {
      toast.error(result.errors[0].message);
    } else {
      toast.success('Loan Product Saved!');
      refresh(); // Refresh the paginated data after successful save
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