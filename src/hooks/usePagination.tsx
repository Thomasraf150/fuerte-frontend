"use client";

import { useState, useCallback, useEffect } from 'react';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  enforcePageLimit,
} from '@/constants/pagination';

// Interface following Single Responsibility Principle
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationConfig {
  initialPageSize?: number;
}

export interface UsePaginationProps {
  fetchFunction: (first: number, page: number, search?: string, statusFilter?: string) => Promise<{
    data: any[];
    paginatorInfo?: {
      total: number;
      currentPage: number;
      lastPage: number;
      hasMorePages: boolean;
    };
  }>;
  config?: PaginationConfig;
  statusFilter?: string;
}

export interface UsePaginationReturn<T> {
  // Data state
  data: T[];
  loading: boolean;
  error: string | null;

  // Pagination state
  pagination: PaginationState;

  // Search state
  searchQuery: string;

  // Actions
  goToPage: (page: number) => Promise<void>;
  changePageSize: (size: number) => Promise<void>;
  setSearchQuery: (query: string) => void;
  refresh: () => Promise<void>;

  // Utility functions
  canGoNext: boolean;
  canGoPrevious: boolean;
}

/**
 * Reusable server-side pagination hook following Clean Architecture principles
 * Implements Single Responsibility: Only handles pagination logic
 * Follows Dependency Inversion: Accepts fetch function as dependency
 *
 * @param fetchFunction Function that fetches data from server
 * @param config Optional configuration for pagination behavior
 */
export function usePagination<T = any>({
  fetchFunction,
  config = {},
  statusFilter = 'all'
}: UsePaginationProps): UsePaginationReturn<T> {

  // Configuration with defaults (enforcing max limits)
  const { initialPageSize = DEFAULT_PAGE_SIZE } = config;

  // Enforce max limit on initial page size
  const safeInitialPageSize = enforcePageLimit(initialPageSize);

  // Data state
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: safeInitialPageSize,
    totalRecords: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data function following error handling patterns from system integration docs
  const fetchData = useCallback(async (
    page: number = pagination.currentPage,
    pageSize: number = pagination.pageSize,
    search: string = debouncedSearchQuery,
    status: string = statusFilter
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Trim search query to handle whitespace-only searches
      const trimmedSearch = search?.trim();
      const response = await fetchFunction(pageSize, page, trimmedSearch || undefined, status);

      // Handle both paginated and non-paginated responses
      if (response.paginatorInfo) {
        // Server returned pagination info
        setData(response.data);
        setPagination(prev => ({
          ...prev,
          currentPage: response.paginatorInfo!.currentPage,
          pageSize: pageSize,
          totalRecords: response.paginatorInfo!.total,
          totalPages: response.paginatorInfo!.lastPage,
          hasNextPage: response.paginatorInfo!.hasMorePages,
          hasPreviousPage: response.paginatorInfo!.currentPage > 1,
        }));
      } else {
        // Fallback for non-paginated responses
        setData(response.data);
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          pageSize: pageSize,
          totalRecords: response.data.length,
          totalPages: Math.ceil(response.data.length / pageSize),
          hasNextPage: false,
          hasPreviousPage: false,
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('Pagination fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, statusFilter]);

  // Action: Go to specific page
  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page > pagination.totalPages) {
      return;
    }
    await fetchData(page, pagination.pageSize, debouncedSearchQuery, statusFilter);
  }, [fetchData, pagination.pageSize, pagination.totalPages, debouncedSearchQuery, statusFilter]);

  // Action: Change page size and reset to first page (with max limit enforcement)
  const changePageSize = useCallback(async (size: number) => {
    // Enforce max limit to prevent DoS and ensure consistent behavior
    const safeSize = enforcePageLimit(size);
    await fetchData(1, safeSize, debouncedSearchQuery, statusFilter);
  }, [fetchData, debouncedSearchQuery, statusFilter]);

  // Action: Refresh current page
  const refresh = useCallback(async () => {
    await fetchData(pagination.currentPage, pagination.pageSize, debouncedSearchQuery, statusFilter);
  }, [pagination.currentPage, pagination.pageSize, debouncedSearchQuery, statusFilter]);

  // Auto-fetch when search query or status filter changes (after debounce)
  useEffect(() => {
    if (debouncedSearchQuery !== '') {
      // Only reset to page 1 if there's an actual search query
      fetchData(1, pagination.pageSize, debouncedSearchQuery, statusFilter);
    } else {
      // If search is cleared, refresh current page
      fetchData(pagination.currentPage, pagination.pageSize, '', statusFilter);
    }
  }, [debouncedSearchQuery, statusFilter]); // Auto-refetch when status filter changes

  // Initial data fetch
  useEffect(() => {
    fetchData(1, safeInitialPageSize, '', statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - run only once on mount

  // Utility computed values
  const canGoNext = pagination.hasNextPage && !loading;
  const canGoPrevious = pagination.hasPreviousPage && !loading;

  return {
    // Data state
    data,
    loading,
    error,

    // Pagination state
    pagination,

    // Search state
    searchQuery,

    // Actions
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,

    // Utility functions
    canGoNext,
    canGoPrevious,
  };
}

// Default page size options for dropdown (exported from constants for consistency)
export const DEFAULT_PAGE_SIZE_OPTIONS = [...PAGE_SIZE_OPTIONS];

// Helper function to create page size options
export function createPageSizeOptions(options: readonly number[] | number[] = PAGE_SIZE_OPTIONS) {
  return options.map(size => ({
    value: size,
    label: `${size} per page`,
  }));
}