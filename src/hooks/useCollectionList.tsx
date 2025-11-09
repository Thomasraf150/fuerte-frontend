"use client"

import { useEffect, useState, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { DataColListRow, DataRowLoanPayments, DataColEntries } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import CollectionListQueryMutations from '@/graphql/CollectionListQueryMutations';
import { fetchWithRecache } from '@/utils/helper';
import { usePagination } from './usePagination';

const useCollectionList = () => {
  const { GET_DATA_COLLECTION_LIST, GET_COLLECTION_ENTRY, SAVE_COLLECTION_ENTRY } = CollectionListQueryMutations;

  // Legacy state (kept for backward compatibility)
  const [dataColEntry, setDataColEntry] = useState<DataRowLoanPayments[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [collectionLoading, setCollectionLoading] = useState<boolean>(false);
  const rowsPerPage = 10;

  // Wrapper function to adapt existing API for usePagination hook
  const fetchCollectionListForPagination = useCallback(async (
    first: number,
    page: number,
    search?: string
  ) => {
    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_DATA_COLLECTION_LIST,
        variables: {
          first,
          page,
          ...(search && { search }), // Add search parameter if provided
          orderBy: [
            { column: "loan_id", order: 'DESC' }
          ]
        },
      }),
    });

    // Return the expected format for usePagination
    return {
      data: response.data.getCollectionLists.data,
      paginatorInfo: response.data.getCollectionLists.paginatorInfo || {
        total: response.data.getCollectionLists.data.length,
        currentPage: page,
        lastPage: 1,
        hasMorePages: false,
      }
    };
  }, [GET_DATA_COLLECTION_LIST]);

  // Use the new pagination hook
  const {
    data: dataColListData,
    loading: collectionListLoading,
    error: collectionListError,
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
    canGoNext,
    canGoPrevious,
  } = usePagination<DataColListRow>({
    fetchFunction: fetchCollectionListForPagination,
    config: {
      initialPageSize: 20,
    }
  });
  
  const fetchCollectionList = async (first: number, page: number, loan_id: number) => {
    setLoading(true);
    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_DATA_COLLECTION_LIST,
        variables: { first, page, orderBy: [
          { column: "loan_id", order: 'DESC' }
        ], loan_id}
      }),
    });

    // const result = await response.json();
    // setDataColListData(response.data.getLoans.data);
    // setDataColListData(response.data.getCollectionLists.data); // FIXME: setDataColListData not defined
    setLoading(false);
  };

  const fetchCollectionEntry = async (loan_schedule_id: String, trans_date: String) => {

    let variables: { input: any } = {
      input : { loan_schedule_id, trans_date }
    };

    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_COLLECTION_ENTRY,
        variables
      }),
    });

    // const result = await response.json();
    // setDataColListData(response.data.getLoans.data);
    setDataColEntry(response.data.getCollectionEntry);
  };

  const postCollectionEntries = async (loan_payments: DataRowLoanPayments[], subsidiaries: DataColEntries) => {
    setCollectionLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];
      subsidiaries.user_id = userData?.user?.id
      let variables: { loan_payments: any, subsidiaries: any } = {
        loan_payments,
        subsidiaries
      };

      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: SAVE_COLLECTION_ENTRY,
          variables
        }),
      });
      
      // Handle API response errors
      if (response.errors) {
        toast.error(response.errors[0].message);
        return { success: false, error: response.errors[0].message };
      }
      
      console.log(response.data.postCollectionEntries, 'response.data.postCollectionEntries');
      if (response.data.postCollectionEntries?.status === false) {
        toast.error(response.data.postCollectionEntries?.message);
        return { success: false, error: response.data.postCollectionEntries?.message };
      } else {
        toast.success(response.data.postCollectionEntries?.message);
        return { success: true, data: response.data.postCollectionEntries };
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setCollectionLoading(false);
    }
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
  }, []);

  return {
    // New pagination functionality
    dataColListData,
    collectionListLoading,
    collectionListError,
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
      searchPlaceholder: "Search for collection...",
    },
    refresh,

    // Legacy functions (kept for backward compatibility)
    fetchCollectionList,
    fetchCollectionEntry,
    dataColEntry,
    loading,
    collectionLoading,
    postCollectionEntries
  };
};

export default useCollectionList;