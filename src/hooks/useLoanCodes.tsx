"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import LoanCodeQueryMutations from '@/graphql/LoanCodeQueryMutations';
import LoanClientsQueryMutations from '@/graphql/LoanClientsQueryMutations';
import { DataRowLoanCodes, DataFormLoanCodes, DataRowClientList, DataRowLoanTypeList } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import { useSmartPagination } from './useSmartPagination';

interface BatchData<T> {
  data: T[];
  pagination: {
    currentBatch: number;
    totalBatches: number;
    batchStartPage: number;
    batchEndPage: number;
    totalRecords: number;
    hasNextBatch: boolean;
  };
  loadedAt?: number;
}

const useLoanCodes = () => {
  const { GET_LOAN_CODE_QUERY, GET_LOAN_TYPE_QUERY, SAVE_LOAN_CODE_MUTATION, UPDATE_LOAN_CODE_MUTATION, GET_LOAN_CODES_BATCH_QUERY } = LoanCodeQueryMutations;
  const { GET_LOAN_CLIENT_QUERY, GET_LOAN_CLIENTS_BATCH_QUERY } = LoanClientsQueryMutations;

  const [singleLoanCode, setSingleLoanCode] = useState<DataRowLoanCodes[]>([]);
  const [dataType, setDataType] = useState<DataRowLoanTypeList[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const rowsPerPage = 15;
  
  // Smart pagination fetch function for loan codes with proper error handling
  const fetchLoanCodesBatch = async (page: number, perPage: number, pagesPerBatch: number): Promise<BatchData<DataRowLoanCodes>> => {
    try {
      console.log('Fetching loan codes batch with params:', { page, perPage, pagesPerBatch });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_LOAN_CODES_BATCH_QUERY,
          variables: { 
            orderBy: 'id_desc',
            page,
            perPage,
            pagesPerBatch
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Loan codes batch response:', result);
      
      if (result.errors && result.errors.length > 0) {
        console.error('GraphQL errors:', result.errors);
        
        // Fallback to legacy query if batch query is not implemented
        console.warn('Batch query failed, falling back to legacy query');
        const legacyData = await fetchLoanCodes();
        return {
          data: legacyData || [],
          pagination: {
            currentBatch: 1,
            totalBatches: 1,
            batchStartPage: 1,
            batchEndPage: 1,
            totalRecords: legacyData?.length || 0,
            hasNextBatch: false,
          }
        };
      }

      if (!result.data?.getLoanCodesBatch) {
        console.warn('No getLoanCodesBatch in response, falling back to legacy');
        const legacyData = await fetchLoanCodes();
        return {
          data: legacyData || [],
          pagination: {
            currentBatch: 1,
            totalBatches: 1,
            batchStartPage: 1,
            batchEndPage: 1,
            totalRecords: legacyData?.length || 0,
            hasNextBatch: false,
          }
        };
      }

      return result.data.getLoanCodesBatch;
    } catch (error) {
      console.error('Error fetching loan codes batch:', error);
      
      // Final fallback to legacy method
      try {
        console.warn('Final fallback to legacy loan codes query');
        const legacyData = await fetchLoanCodes();
        return {
          data: legacyData || [],
          pagination: {
            currentBatch: 1,
            totalBatches: 1,
            batchStartPage: 1,
            batchEndPage: 1,
            totalRecords: legacyData?.length || 0,
            hasNextBatch: false,
          }
        };
      } catch (legacyError) {
        console.error('Legacy fallback also failed:', legacyError);
        throw new Error(`Both batch and legacy queries failed: ${error.message}`);
      }
    }
  };

  // Smart pagination fetch function for loan clients with proper error handling
  const fetchLoanClientsBatch = async (page: number, perPage: number, pagesPerBatch: number): Promise<BatchData<DataRowClientList>> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_LOAN_CLIENTS_BATCH_QUERY,
          variables: { 
            orderBy: 'id_desc',
            page,
            perPage,
            pagesPerBatch
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        throw new Error(`GraphQL Error: ${result.errors[0].message}`);
      }

      if (!result.data?.getLoanClientsBatch) {
        throw new Error('Invalid response structure from server');
      }

      return result.data.getLoanClientsBatch;
    } catch (error) {
      console.error('Error fetching loan clients batch:', error);
      throw error;
    }
  };

  // Use smart pagination for loan codes
  const loanCodesPagination = useSmartPagination(fetchLoanCodesBatch, {
    perPage: 20,
    pagesPerBatch: 1,
    maxCachedBatches: 3
  });

  // Use smart pagination for loan clients
  const loanClientsPagination = useSmartPagination(fetchLoanClientsBatch, {
    perPage: rowsPerPage,
    pagesPerBatch: 3,
    maxCachedBatches: 3
  });
  // Function to fetchdata
  
  const fetchLoanCodes = async (orderBy = 'id_desc') => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LOAN_CODE_QUERY,
        variables: { orderBy },
      }),
    });

    const result = await response.json();
    // Note: With smart pagination, data is managed by loanCodesPagination.data
    // This legacy function is kept for backwards compatibility but doesn't update state
    return result.data.getLoanCodes;
  };
  const fetchLoanClients = async (orderBy = 'id_desc') => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LOAN_CLIENT_QUERY,
        variables: { orderBy },
      }),
    });

    const result = await response.json();
    // Note: With smart pagination, data is managed by loanClientsPagination.data
    // This legacy function is kept for backwards compatibility but doesn't update state
    return result.data.getLoanClient;
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
    // if (result.data.createBranch?.name !== null) {
    //   await fetchDataList();
    // }
    toast.success("User Saved!");
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    // Smart pagination handles initial loading automatically
    // Legacy methods for dropdown data that doesn't need pagination
    fetchLoanTypes()
  }, []);

  return {
    data: loanCodesPagination.data,
    allLoanCodesData: loanCodesPagination.allLoadedData,
    currentPage: loanCodesPagination.currentPage,
    totalPages: loanCodesPagination.totalPages,
    totalRecords: loanCodesPagination.totalRecords,
    hasNextPage: loanCodesPagination.hasNextPage,
    loading: loanCodesPagination.loading || loading,
    prefetching: loanCodesPagination.prefetching,
    navigateToPage: loanCodesPagination.navigateToPage,
    refresh: loanCodesPagination.refresh,
    dataClients: loanClientsPagination.data,
    clientsCurrentPage: loanClientsPagination.currentPage,
    clientsTotalPages: loanClientsPagination.totalPages,
    clientsNavigateToPage: loanClientsPagination.navigateToPage,
    clientsRefresh: loanClientsPagination.refresh,
    onSubmitLoanCode,
    dataType,
    fetchLoanCodes, // Legacy function for backward compatibility
    fetchLoanClients // Legacy function for backward compatibility
  };
};

export default useLoanCodes;