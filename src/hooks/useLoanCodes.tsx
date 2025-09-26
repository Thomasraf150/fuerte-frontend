"use client"

import { useEffect, useState, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import LoanCodeQueryMutations from '@/graphql/LoanCodeQueryMutations';
import LoanClientsQueryMutations from '@/graphql/LoanClientsQueryMutations';
import { DataRowLoanCodes, DataFormLoanCodes, DataRowClientList, DataRowLoanTypeList } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import { usePagination } from './usePagination';

const useLoanCodes = () => {
  const { GET_LOAN_CODE_QUERY, GET_LOAN_TYPE_QUERY, SAVE_LOAN_CODE_MUTATION, UPDATE_LOAN_CODE_MUTATION } = LoanCodeQueryMutations;
  const { GET_LOAN_CLIENT_QUERY } = LoanClientsQueryMutations;
  const [loanCodeLoading, setLoanCodeLoading] = useState<boolean>(false);

  // Wrapper function to adapt existing API for usePagination hook
  const fetchLoanCodesForPagination = useCallback(async (
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
        query: GET_LOAN_CODE_QUERY,
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
      data: result.data.getLoanCodes.data,
      paginatorInfo: result.data.getLoanCodes.paginatorInfo || {
        total: result.data.getLoanCodes.data.length,
        currentPage: page,
        lastPage: 1,
        hasMorePages: false,
      }
    };
  }, [GET_LOAN_CODE_QUERY]);

  // Use the new pagination hook
  const {
    data: dataLoanCodes,
    loading: loanCodesLoading,
    error: loanCodesError,
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
    canGoNext,
    canGoPrevious,
  } = usePagination<DataRowLoanCodes>({
    fetchFunction: fetchLoanCodesForPagination,
    config: {
      initialPageSize: 20,
      defaultPageSize: 20,
    },
  });

  // Legacy fetchLoanCodes function for backward compatibility
  const fetchLoanCodes = useCallback(async (orderBy = 'id_desc') => {
    const result = await fetchLoanCodesForPagination(20, 1);
    // This maintains the old behavior for any existing code that still uses it
    return result;
  }, [fetchLoanCodesForPagination]);

  // Legacy state for backward compatibility
  const [dataClients, setDataClients] = useState<DataRowClientList[]>([]);
  const [dataType, setDataType] = useState<DataRowLoanTypeList[]>([]);
  const fetchLoanClients = async (orderBy = 'id_desc') => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_LOAN_CLIENT_QUERY,
          variables: { 
            first: 1000, // Get a large number to fetch all loan clients
            page: 1,
            orderBy: [
              { column: "id", order: orderBy.includes('desc') ? 'DESC' : 'ASC' }
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
        console.error('Error fetching loan clients:', result.errors);
        setDataClients([]);
        return;
      }

      // Check if response has the expected structure
      if (result.data && result.data.getLoanClient && result.data.getLoanClient.data) {
        setDataClients(result.data.getLoanClient.data);
      } else {
        console.error('Unexpected response structure for loan clients:', result);
        setDataClients([]);
      }
    } catch (error) {
      console.error('Error fetching loan clients:', error);
      setDataClients([]);
    }
  };
  
  const fetchLoanTypes = async (orderBy = 'id_desc') => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LOAN_TYPE_QUERY,
        variables: { orderBy },
      }),
    });

    const result = await response.json();
    setDataType(result.data.getLoanTypes);
  };

  const onSubmitLoanCode = async (data: DataFormLoanCodes) => {
    setLoanCodeLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];

      let mutation;
      let variables: { input: any } = {
        input: {
          code: data.code,
          description: data.description,
          loan_client_id: Number(data.loan_client_id),
          loan_type_id: Number(data.loan_type_id),
          user_id: userData?.user?.id
        },
      };

      if (data.id) {
        mutation = UPDATE_LOAN_CODE_MUTATION;
        variables.input.id = data.id;
      } else {
        mutation = SAVE_LOAN_CODE_MUTATION;
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

      // Handle GraphQL errors
      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for successful creation/update
      if (result.data?.createLoanCode || result.data?.updateLoanCode) {
        const responseData = result.data.createLoanCode || result.data.updateLoanCode;
        toast.success("Loan code saved successfully!");
        fetchLoanCodes();
        return { success: true, data: responseData };
      }

      toast.success("Loan code saved successfully!");
      fetchLoanCodes();
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoanCodeLoading(false);
    }
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchLoanCodes()
    fetchLoanClients()
    fetchLoanTypes()
  }, []);

  return {
    // Legacy API for backward compatibility
    data: dataLoanCodes,
    loading: loanCodesLoading,
    dataClients,
    onSubmitLoanCode,
    dataType,
    fetchLoanCodes,
    loanCodeLoading,

    // New pagination functionality
    dataLoanCodes,
    loanCodesLoading,
    loanCodesError,
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

export default useLoanCodes;