"use client"

import { useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import LoanClientsQueryMutations from '@/graphql/LoanClientsQueryMutations';
import { DataRowClientList } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import { usePagination } from './usePagination';

const useClients = () => {
  const { GET_LOAN_CLIENT_QUERY } = LoanClientsQueryMutations;

  // Create pagination wrapper function following the established pattern
  const fetchClientsForPagination = useCallback(async (first: number, page: number, search?: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_LOAN_CLIENT_QUERY,
        variables: {
          first,
          page,
          ...(search && { search }),
          orderBy: [{ column: "id", order: 'DESC' }]
        },
      }),
    });
    const result = await response.json();
    return {
      data: result.data.getLoanClient.data,
      paginatorInfo: result.data.getLoanClient.paginatorInfo
    };
  }, [GET_LOAN_CLIENT_QUERY]);

  // Use pagination hook
  const {
    data: dataClients,
    loading: clientsLoading,
    error: clientsError,
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
  } = usePagination<DataRowClientList>({
    fetchFunction: fetchClientsForPagination,
    config: { initialPageSize: 20 }
  });

  // Legacy function for backward compatibility
  const fetchClients = async (orderBy = 'id_desc') => {
    refresh();
  };

  // Return server-side pagination props
  return {
    // Legacy compatibility
    data: dataClients,
    fetchClients,

    // New pagination functionality
    dataClients,
    clientsLoading,
    clientsError,
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
      searchPlaceholder: "Search client name...",
    },
  };
};

export default useClients;