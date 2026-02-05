"use client"

import { useCallback, useEffect, useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import AreaSubAreaQueryMutations from '@/graphql/AreaSubAreaQueryMutations';
import BranchQueryMutation from '@/graphql/BranchQueryMutation';
import { usePagination } from './usePagination';

import { DataArea, DataSubBranches } from '@/utils/DataTypes';
import { toast } from "react-toastify";

const useArea = () => {
  const { GET_AREA_QUERY,
          SAVE_AREA_MUTATION,
          UPDATE_AREA_MUTATION,
          DELETE_AREA_MUTATION } = AreaSubAreaQueryMutations;
  const { GET_ALL_SUB_BRANCH_QUERY } = BranchQueryMutation;

  const [branchSubData, setBranchSubData] = useState<DataSubBranches[] | undefined>(undefined);
  const [areaLoading, setAreaLoading] = useState<boolean>(false);

  // Fetch sub-branches for form dropdown
  const fetchDataSubBranch = async (orderBy = 'id_desc') => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_ALL_SUB_BRANCH_QUERY,
        variables: { orderBy }
      }),
    });
    const result = await response.json();
    setBranchSubData(result.data.getAllBranch);
  };

  // Wrapper for usePagination (same pattern as useBorrower)
  const fetchAreasForPagination = useCallback(async (
    first: number,
    page: number,
    search?: string
  ) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_AREA_QUERY,
        variables: {
          first,
          page,
          ...(search && { search }),
          orderBy: [{ column: "id", order: 'DESC' }]
        },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error occurred');
    }

    if (!result.data || !result.data.getAreas) {
      throw new Error('No data returned from server');
    }

    return {
      data: result.data.getAreas.data,
      paginatorInfo: result.data.getAreas.paginatorInfo || {
        total: result.data.getAreas.data.length,
        currentPage: page,
        lastPage: 1,
        hasMorePages: false,
      }
    };
  }, [GET_AREA_QUERY]);

  // Server-side pagination
  const {
    data: dataArea,
    loading: paginationLoading,
    error: areaError,
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
  } = usePagination<DataArea>({
    fetchFunction: fetchAreasForPagination,
    config: { initialPageSize: 20 },
  });

  // Fetch sub-branches on mount (for form dropdown)
  useEffect(() => {
    fetchDataSubBranch();
  }, []);

  const onSubmitArea: SubmitHandler<DataArea> = async (data) => {
    setAreaLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];

      let mutation;
      let variables: { input: any } = {
        input: {
          branch_sub_id: data.branch_sub_id,
          name: data.name,
          description: data.description,
          user_id: userData?.user?.id
        },
      };

      if (data.id) {
        mutation = UPDATE_AREA_MUTATION;
        variables.input.id = data.id;
      } else {
        mutation = SAVE_AREA_MUTATION;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutation, variables }),
      });

      const result = await response.json();

      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      toast.success("Area saved successfully!");
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setAreaLoading(false);
    }
  };

  const handleDeleteArea = async (data: DataArea) => {
    try {
      const variables = { input: { id: data.id, is_deleted: 1 } };
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: DELETE_AREA_MUTATION, variables }),
      });
      const result = await response.json();
      if (result.errors) {
        toast.error(result.errors[0]?.message || 'Failed to delete area');
        return;
      }
      toast.success("Area is Deleted!");
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  return {
    dataArea,
    branchSubData,
    onSubmitArea,
    areaLoading,
    paginationLoading,
    handleDeleteArea,
    areaError,
    refresh,

    // Server-side pagination for CustomDatatable
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
      recordType: 'area',
      recordTypePlural: 'areas',
    },
  };
};

export default useArea;
