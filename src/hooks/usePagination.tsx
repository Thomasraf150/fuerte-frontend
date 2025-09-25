"use client";

import { useState, useCallback, useEffect } from 'react';

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
  defaultPageSize?: number;
}

export interface UsePaginationProps {
  fetchFunction: (first: number, page: number, search?: string) => Promise<{
    data: any[];
    paginatorInfo?: {
      total: number;
      currentPage: number;
      lastPage: number;
      hasMorePages: boolean;
    };
  }>;
  config?: PaginationConfig;
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
  config = {}
}: UsePaginationProps): UsePaginationReturn<T> {

  // Configuration with defaults
  const {
    initialPageSize = 20,
    defaultPageSize = 20
  } = config;

  // Data state
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: initialPageSize,
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
    search: string = debouncedSearchQuery
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Trim search query to handle whitespace-only searches
      const trimmedSearch = search?.trim();
      const response = await fetchFunction(pageSize, page, trimmedSearch || undefined);

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
  }, [fetchFunction]);

  // Action: Go to specific page
  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page > pagination.totalPages) {
      return;
    }
    await fetchData(page, pagination.pageSize, debouncedSearchQuery);
  }, [fetchData, pagination.pageSize, pagination.totalPages, debouncedSearchQuery]);

  // Action: Change page size and reset to first page
  const changePageSize = useCallback(async (size: number) => {
    await fetchData(1, size, debouncedSearchQuery);
  }, [fetchData, debouncedSearchQuery]);

  // Action: Refresh current page
  const refresh = useCallback(async () => {
    await fetchData(pagination.currentPage, pagination.pageSize, debouncedSearchQuery);
  }, [pagination.currentPage, pagination.pageSize, debouncedSearchQuery]);

  // Auto-fetch when search query changes (after debounce)
  useEffect(() => {
    if (debouncedSearchQuery !== '') {
      // Only reset to page 1 if there's an actual search query
      fetchData(1, pagination.pageSize, debouncedSearchQuery);
    } else {
      // If search is cleared, refresh current page
      fetchData(pagination.currentPage, pagination.pageSize, '');
    }
  }, [debouncedSearchQuery]); // FIXED: Remove pagination dependencies to prevent infinite loop

  // Initial data fetch
  useEffect(() => {
    fetchData(1, initialPageSize, '');
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

// Default page size options for dropdown
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Helper function to create page size options
export function createPageSizeOptions(options: number[] = DEFAULT_PAGE_SIZE_OPTIONS) {
  return options.map(size => ({
    value: size,
    label: `${size} per page`,
  }));
}