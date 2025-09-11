"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import LoanProductsQueryMutations from '@/graphql/LoanProductsQueryMutations';
import { DataRowLoanProducts, DataFormLoanProducts } from '@/utils/DataTypes';
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

const useLoanProducts = () => {
  const { GET_LOAN_PRODUCT_QUERY, SAVE_LOAN_PRODUCT_QUERY, UPDATE_LOAN_PRODUCT_QUERY, GET_LOAN_PRODUCTS_BATCH_QUERY } = LoanProductsQueryMutations;

  const [loading, setLoading] = useState<boolean>(false);
  const rowsPerPage = 15;
  
  // Smart pagination fetch function with proper error handling
  const fetchLoanProductsBatch = async (page: number, perPage: number, pagesPerBatch: number): Promise<BatchData<DataRowLoanProducts>> => {
    try {
      console.log('Fetching loan products batch with params:', { page, perPage, pagesPerBatch });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_LOAN_PRODUCTS_BATCH_QUERY,
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
      console.log('Loan products batch response:', result);
      
      if (result.errors && result.errors.length > 0) {
        console.error('GraphQL errors:', result.errors);
        
        // Fallback to legacy query if batch query is not implemented
        console.warn('Batch query failed, falling back to legacy query');
        const legacyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: GET_LOAN_PRODUCT_QUERY,
            variables: { orderBy: 'id_desc' },
          }),
        });
        const legacyResult = await legacyResponse.json();
        const legacyData = legacyResult.data?.getLoanProducts || [];
        
        return {
          data: legacyData,
          pagination: {
            currentBatch: 1,
            totalBatches: 1,
            batchStartPage: 1,
            batchEndPage: 1,
            totalRecords: legacyData.length,
            hasNextBatch: false,
          }
        };
      }

      if (!result.data?.getLoanProductsBatch) {
        console.warn('No getLoanProductsBatch in response, falling back to legacy');
        const legacyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: GET_LOAN_PRODUCT_QUERY,
            variables: { orderBy: 'id_desc' },
          }),
        });
        const legacyResult = await legacyResponse.json();
        const legacyData = legacyResult.data?.getLoanProducts || [];
        
        return {
          data: legacyData,
          pagination: {
            currentBatch: 1,
            totalBatches: 1,
            batchStartPage: 1,
            batchEndPage: 1,
            totalRecords: legacyData.length,
            hasNextBatch: false,
          }
        };
      }

      return result.data.getLoanProductsBatch;
    } catch (error) {
      console.error('Error fetching loan products batch:', error);
      
      // Final fallback to legacy method
      try {
        console.warn('Final fallback to legacy loan products query');
        const legacyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: GET_LOAN_PRODUCT_QUERY,
            variables: { orderBy: 'id_desc' },
          }),
        });
        const legacyResult = await legacyResponse.json();
        const legacyData = legacyResult.data?.getLoanProducts || [];
        
        return {
          data: legacyData,
          pagination: {
            currentBatch: 1,
            totalBatches: 1,
            batchStartPage: 1,
            batchEndPage: 1,
            totalRecords: legacyData.length,
            hasNextBatch: false,
          }
        };
      } catch (legacyError) {
        console.error('Legacy fallback also failed:', legacyError);
        throw new Error(`Both batch and legacy queries failed: ${error.message}`);
      }
    }
  };

  // Use smart pagination
  const pagination = useSmartPagination(fetchLoanProductsBatch, {
    perPage: rowsPerPage,
    pagesPerBatch: 1,
    maxCachedBatches: 3
  });

  // Legacy fetch function for backward compatibility
  const fetchLoanProducts = async (orderBy = 'id_desc') => {
    setLoading(true);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LOAN_PRODUCT_QUERY,
        variables: { orderBy },
      }),
    });

    const result = await response.json();
    // For legacy compatibility, we'll still set a data state
    // but this should ideally be replaced with pagination.data usage
    setLoading(false);
    return result.data.getLoanProducts;
  };

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
    }
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    // fetchLoanProducts()
  }, []);

  return {
    data: pagination.data,
    allLoanProductsData: pagination.allLoadedData,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalRecords: pagination.totalRecords,
    hasNextPage: pagination.hasNextPage,
    loading: pagination.loading || loading,
    prefetching: pagination.prefetching,
    navigateToPage: pagination.navigateToPage,
    refresh: pagination.refresh,
    setPerPage: pagination.setPerPage, // Add setPerPage for rows per page changes
    onSubmitLoanProduct,
    fetchLoanProducts, // Legacy function for backward compatibility
  };
};

export default useLoanProducts;