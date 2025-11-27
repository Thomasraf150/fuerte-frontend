"use client"

import { useState, useCallback } from 'react';
import { SubmitHandler } from 'react-hook-form';
import BorrowerCompaniesQueryMutations from '@/graphql/BorrowerCompaniesQueryMutations';
import { usePagination } from './usePagination';
import { DataBorrCompanies } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { ServerSidePaginationProps } from '@/components/CustomDatatable';

const useBorrCompanies = () => {
  const { GET_BORROWER_COMPANIES, SAVE_BORROWER_COMPANIES, UPDATE_BORROWER_COMPANIES, DELETE_BORR_COMP_MUTATION } = BorrowerCompaniesQueryMutations;

  const [borrCompLoading, setBorrCompLoading] = useState<boolean>(false);

  // Wrapper function to adapt API for usePagination hook
  const fetchCompaniesForPagination = useCallback(async (
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
        query: GET_BORROWER_COMPANIES,
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
      data: result.data.getBorrCompanies.data,
      paginatorInfo: result.data.getBorrCompanies.paginatorInfo
    };
  }, [GET_BORROWER_COMPANIES]);

  // Use the pagination hook with search support
  const {
    data: dataBorrComp,
    loading: borrCompFetchLoading,
    error: borrCompError,
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
  } = usePagination<DataBorrCompanies>({
    fetchFunction: fetchCompaniesForPagination,
    config: {
      initialPageSize: 10,
      defaultPageSize: 10,
    },
  });

  // Legacy function for backward compatibility
  const fetchDataBorrComp = useCallback(async (first: number, page: number) => {
    await refresh();
  }, [refresh]);

  const onSubmitBorrComp: SubmitHandler<DataBorrCompanies> = async (data) => {
    setBorrCompLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];

      let mutation;
      let variables: { input: any } = {
        input: {
          name: data.name,
          address: data.address,
          contact_person: data.contact_person,
          contact_no: data.contact_no,
          contact_email: data.contact_email,
          user_id: userData?.user?.id
        },
      };

      if (data.id) {
        mutation = UPDATE_BORROWER_COMPANIES;
        variables.input.id = data.id;
      } else {
        mutation = SAVE_BORROWER_COMPANIES;
      }

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

      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      if (result.data?.createBorrCompany || result.data?.updateBorrCompany) {
        const responseData = result.data.createBorrCompany || result.data.updateBorrCompany;
        toast.success("Borrower company saved successfully!");
        return { success: true, data: responseData };
      }

      toast.success("Borrower company saved successfully!");
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setBorrCompLoading(false);
    }
  };

  const handleDeleteBranch = async (data: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: DELETE_BORR_COMP_MUTATION,
          variables: { input: { id: data.id, is_deleted: 1 } }
        }),
      });
      const result = await response.json();

      if (result.errors) {
        toast.error(result.errors[0].message);
        return;
      }
      toast.success("Borrower Company is Deleted!");
    } catch (error) {
      toast.error("Failed to delete company");
    }
  };

  // Server-side pagination props for CustomDatatable
  const serverSidePaginationProps: ServerSidePaginationProps = {
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
    enableSearch: true,
    searchPlaceholder: 'Search by name, address, contact...',
    recordType: 'company',
    recordTypePlural: 'companies',
  };

  return {
    // Legacy exports (backward compatibility)
    fetchDataBorrComp,
    dataBorrComp,
    onSubmitBorrComp,
    handleDeleteBranch,
    borrCompLoading,
    borrCompFetchLoading,

    // New pagination functionality
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
    borrCompError,
    serverSidePaginationProps,
  };
};

export default useBorrCompanies;
