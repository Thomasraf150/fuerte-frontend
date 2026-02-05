"use client"

import { useCallback, useEffect, useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import AreaSubAreaQueryMutations from '@/graphql/AreaSubAreaQueryMutations';
import { usePagination } from './usePagination';

import { DataArea, DataSubArea } from '@/utils/DataTypes';
import { MAX_DROPDOWN_SIZE } from '@/constants/pagination';
import { toast } from "react-toastify";

const useSubArea = () => {
  const { GET_AREA_QUERY,
          GET_SUB_AREA_QUERY,
          SAVE_SUB_AREA_MUTATION,
          UPDATE_SUB_AREA_MUTATION,
          DELETE_SUB_AREA_MUTATION } = AreaSubAreaQueryMutations;

  const [dataArea, setDataArea] = useState<DataArea[] | undefined>(undefined);
  const [subAreaLoading, setSubAreaLoading] = useState<boolean>(false);

  // Fetch all areas for the form dropdown (not paginated)
  const fetchDataArea = useCallback(async (first: number, page: number) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_AREA_QUERY,
        variables: { first, page, orderBy: [{ column: "id", order: 'DESC' }] },
      }),
    });
    const result = await response.json();
    setDataArea(result.data.getAreas.data);
  }, [GET_AREA_QUERY]);

  // Wrapper for usePagination (same pattern as useBorrower)
  const fetchSubAreasForPagination = useCallback(async (
    first: number,
    page: number,
    search?: string
  ) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_SUB_AREA_QUERY,
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

    if (!result.data || !result.data.getSubAreas) {
      throw new Error('No data returned from server');
    }

    return {
      data: result.data.getSubAreas.data,
      paginatorInfo: result.data.getSubAreas.paginatorInfo || {
        total: result.data.getSubAreas.data.length,
        currentPage: page,
        lastPage: 1,
        hasMorePages: false,
      }
    };
  }, [GET_SUB_AREA_QUERY]);

  // Server-side pagination for sub-areas table
  const {
    data: dataSubArea,
    loading: paginationLoading,
    error: subAreaError,
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
  } = usePagination<DataSubArea>({
    fetchFunction: fetchSubAreasForPagination,
    config: { initialPageSize: 20 },
  });

  // Fetch areas on mount (for form dropdown)
  useEffect(() => {
    fetchDataArea(MAX_DROPDOWN_SIZE, 1);
  }, [fetchDataArea]);

  const onSubmitSubArea: SubmitHandler<DataSubArea> = async (data) => {
    setSubAreaLoading(true);
    try {
      let mutation;
      let variables: { input: any } = {
        input: {
          area_id: data.area_id,
          name: data.name,
        },
      };

      if (data.id) {
        mutation = UPDATE_SUB_AREA_MUTATION;
        variables.input.id = data.id;
      } else {
        mutation = SAVE_SUB_AREA_MUTATION;
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

      toast.success("Sub Area saved successfully!");
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSubAreaLoading(false);
    }
  };

  const handleDeleteSubArea = async (data: DataSubArea) => {
    try {
      const variables = { input: { id: data.id, is_deleted: 1 } };
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: DELETE_SUB_AREA_MUTATION, variables }),
      });
      const result = await response.json();
      if (result.errors) {
        toast.error(result.errors[0]?.message || 'Failed to delete sub area');
        return;
      }
      toast.success("Sub Area is Deleted!");
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  return {
    dataArea,
    dataSubArea,
    onSubmitSubArea,
    handleDeleteSubArea,
    subAreaLoading,
    paginationLoading,
    subAreaError,
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
      recordType: 'sub area',
      recordTypePlural: 'sub areas',
    },
  };
};

export default useSubArea;
