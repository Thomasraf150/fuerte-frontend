"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import NotesReceivableQueryMutation from '@/graphql/NotesReceivableQueryMutation';
import moment from 'moment';

// Types
interface NrTransPerMonth {
  month: string;
  current_target: string;
  actual_collection: string;
  ua_sp: string;
  past_due_target_ua_sp: string;
  actual_col_ua_sp: string;
  past_due_balance_ua_sp: string;
  advanced_payment: string;
  ob_closed: string;
  early_full_payments: string;
  adjustments: string;
}

interface NrDataItem {
  loan_ref: string;
  firstname: string;
  middlename: string;
  lastname: string;
  released_date: string;
  from: string;
  to: string;
  pn_amount: string;
  terms: string;
  trans_per_month: NrTransPerMonth[];
}

interface BatchPagination {
  currentBatch: number;
  totalBatches: number;
  batchStartPage: number;
  batchEndPage: number;
  totalRecords: number;
  hasNextBatch: boolean;
  perPage: number;
  currentPage: number;
}

interface NotesReceivableFilters {
  startDate: Date | null;
  endDate: Date | null;
  branchId?: string;
  searchTerm?: string;
}

interface SmartPaginationConfig {
  perPage?: number;
  pagesPerBatch?: number;
  maxCachedBatches?: number;
  enableAutoFetch?: boolean;
}

interface BatchCacheItem {
  data: NrDataItem[];
  months: string[];
  pagination: BatchPagination;
  timestamp: number;
}

export interface UseNotesReceivablePaginatedReturn {
  // Data
  data: NrDataItem[];
  allLoadedData: NrDataItem[];
  months: string[];
  
  // Loading states
  loading: boolean;
  initialLoading: boolean;
  loadingMore: boolean;
  
  // Pagination
  currentPage: number;
  hasNextPage: boolean;
  totalRecords: number;
  pagination: BatchPagination | null;
  
  // Actions
  loadNextBatch: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  setFilters: (filters: NotesReceivableFilters) => void;
  setPerPage: (perPage: number) => void;
  
  // Error handling
  error: string | null;
  retryCount: number;
  retry: () => Promise<void>;
}

const DEFAULT_CONFIG: Required<SmartPaginationConfig> = {
  perPage: 20,
  pagesPerBatch: 1, // Reduced from 2 to 1 to prevent lag
  maxCachedBatches: 2, // Reduced from 3 to 2 to save memory
  enableAutoFetch: true,
};

export function useNotesReceivablePaginated(
  initialFilters: NotesReceivableFilters,
  config: SmartPaginationConfig = {}
): UseNotesReceivablePaginatedReturn {
  
  // Configuration
  const {
    perPage,
    pagesPerBatch,
    maxCachedBatches,
    enableAutoFetch
  } = { ...DEFAULT_CONFIG, ...config };

  // State
  const [data, setData] = useState<NrDataItem[]>([]);
  const [allLoadedData, setAllLoadedData] = useState<NrDataItem[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<BatchPagination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [filters, setFilters] = useState<NotesReceivableFilters>(initialFilters);
  const [currentPerPage, setCurrentPerPage] = useState(perPage);

  // Cache for batch data
  const batchCache = useRef<Map<string, BatchCacheItem>>(new Map());
  const lastFetchTime = useRef<number>(0);
  
  // Queries
  const { NR_SCHEDULE_BATCH, NR_SCHEDULE_LIST } = NotesReceivableQueryMutation;

  // Generate cache key
  const generateCacheKey = useCallback((page: number, filters: NotesReceivableFilters, perPageValue: number) => {
    const batchStartPage = Math.floor((page - 1) / pagesPerBatch) * pagesPerBatch + 1;
    return `${moment(filters.startDate).format('YYYY-MM-DD')}_${moment(filters.endDate).format('YYYY-MM-DD')}_${filters.branchId || ''}_${filters.searchTerm || ''}_${batchStartPage}_${perPageValue}`;
  }, [pagesPerBatch]);

  // Clear cache
  const clearCache = useCallback(() => {
    batchCache.current.clear();
    setAllLoadedData([]);
  }, []);

  // Cleanup old cache entries
  const cleanupCache = useCallback(() => {
    const entries = Array.from(batchCache.current.entries());
    if (entries.length > maxCachedBatches) {
      // Sort by timestamp and remove oldest
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < entries.length - maxCachedBatches; i++) {
        batchCache.current.delete(entries[i][0]);
      }
    }
  }, [maxCachedBatches]);

  // Fetch batch data with error handling and fallback
  const fetchBatchData = useCallback(async (
    page: number,
    currentFilters: NotesReceivableFilters,
    perPageValue: number,
    isRetry: boolean = false
  ): Promise<{ data: NrDataItem[], months: string[], pagination: BatchPagination } | null> => {
    
    if (!currentFilters.startDate || !currentFilters.endDate) {
      throw new Error('Start date and end date are required');
    }

    const batchStartPage = Math.floor((page - 1) / pagesPerBatch) * pagesPerBatch + 1;
    
    const variables = {
      input: {
        startDate: moment(currentFilters.startDate).format('YYYY-MM-DD'),
        endDate: moment(currentFilters.endDate).format('YYYY-MM-DD'),
        branchId: currentFilters.branchId || null,
        searchTerm: currentFilters.searchTerm || null,
        page: batchStartPage,
        perPage: perPageValue,
        pagesPerBatch: pagesPerBatch,
      },
    };

    try {
      // Try new batch query first
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: NR_SCHEDULE_BATCH,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        console.warn('Batch query failed, falling back to legacy query:', result.errors[0].message);
        
        // Fallback to legacy query
        const legacyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: NR_SCHEDULE_LIST,
            variables: {
              input: {
                startDate: variables.input.startDate,
                endDate: variables.input.endDate,
                branchId: variables.input.branchId,
                searchTerm: variables.input.searchTerm,
              }
            },
          }),
        });

        const legacyResult = await legacyResponse.json();
        const legacyData = legacyResult.data?.getNrSchedule || { data: [], months: [] };
        
        // Create pagination info for legacy data
        const totalRecords = legacyData.data.length;
        const startIndex = (batchStartPage - 1) * perPageValue;
        const endIndex = Math.min(startIndex + (pagesPerBatch * perPageValue), totalRecords);
        const batchData = legacyData.data.slice(startIndex, endIndex);
        
        return {
          data: batchData,
          months: legacyData.months,
          pagination: {
            currentBatch: Math.ceil(batchStartPage / pagesPerBatch),
            totalBatches: Math.ceil(totalRecords / (pagesPerBatch * perPageValue)),
            batchStartPage,
            batchEndPage: Math.min(batchStartPage + pagesPerBatch - 1, Math.ceil(totalRecords / perPageValue)),
            totalRecords,
            hasNextBatch: endIndex < totalRecords,
            perPage: perPageValue,
            currentPage: page
          }
        };
      }

      const batchResult = result.data?.getNrScheduleBatch;
      if (!batchResult) {
        throw new Error('No data returned from batch query');
      }

      return {
        data: batchResult.data || [],
        months: batchResult.months || [],
        pagination: batchResult.pagination
      };

    } catch (error) {
      console.error('Batch fetch error:', error);
      
      if (!isRetry) {
        // Try legacy query as final fallback
        try {
          const legacyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: NR_SCHEDULE_LIST,
              variables: {
                input: {
                  startDate: variables.input.startDate,
                  endDate: variables.input.endDate,
                  branchId: variables.input.branchId,
                  searchTerm: variables.input.searchTerm,
                }
              },
            }),
          });

          if (legacyResponse.ok) {
            const legacyResult = await legacyResponse.json();
            const legacyData = legacyResult.data?.getNrSchedule || { data: [], months: [] };
            
            const totalRecords = legacyData.data.length;
            const startIndex = (batchStartPage - 1) * perPageValue;
            const endIndex = Math.min(startIndex + (pagesPerBatch * perPageValue), totalRecords);
            const batchData = legacyData.data.slice(startIndex, endIndex);
            
            return {
              data: batchData,
              months: legacyData.months,
              pagination: {
                currentBatch: Math.ceil(batchStartPage / pagesPerBatch),
                totalBatches: Math.ceil(totalRecords / (pagesPerBatch * perPageValue)),
                batchStartPage,
                batchEndPage: Math.min(batchStartPage + pagesPerBatch - 1, Math.ceil(totalRecords / perPageValue)),
                totalRecords,
                hasNextBatch: endIndex < totalRecords,
                perPage: perPageValue,
                currentPage: page
              }
            };
          }
        } catch (legacyError) {
          console.error('Legacy query also failed:', legacyError);
        }
      }
      
      throw error;
    }
  }, [NR_SCHEDULE_BATCH, NR_SCHEDULE_LIST, pagesPerBatch]);

  // Load data for a specific page
  const loadPage = useCallback(async (
    page: number,
    currentFilters: NotesReceivableFilters,
    perPageValue: number,
    isInitial: boolean = false
  ) => {
    const cacheKey = generateCacheKey(page, currentFilters, perPageValue);
    
    // Check cache first
    const cachedData = batchCache.current.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < 300000) { // 5 minutes
      setData(cachedData.data);
      setMonths(cachedData.months);
      setPagination(cachedData.pagination);
      setCurrentPage(page);
      
      // Update all loaded data
      const allCached = Array.from(batchCache.current.values())
        .sort((a, b) => a.pagination.batchStartPage - b.pagination.batchStartPage)
        .flatMap(item => item.data);
      setAllLoadedData(allCached);
      
      return;
    }

    // Set loading states
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }
    setLoading(true);
    setError(null);

    try {
      const result = await fetchBatchData(page, currentFilters, perPageValue);
      
      if (result) {
        // Cache the result
        const cacheItem: BatchCacheItem = {
          ...result,
          timestamp: Date.now(),
        };
        batchCache.current.set(cacheKey, cacheItem);
        cleanupCache();

        // Update state
        setData(result.data);
        setMonths(result.months);
        setPagination(result.pagination);
        setCurrentPage(page);
        setRetryCount(0);

        // Update all loaded data
        const allCached = Array.from(batchCache.current.values())
          .sort((a, b) => a.pagination.batchStartPage - b.pagination.batchStartPage)
          .flatMap(item => item.data);
        setAllLoadedData(allCached);
        
        lastFetchTime.current = Date.now();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('Load page error:', error);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      setLoadingMore(false);
    }
  }, [generateCacheKey, fetchBatchData, cleanupCache]);

  // Actions
  const loadNextBatch = useCallback(async () => {
    if (!pagination?.hasNextBatch || loadingMore) return;
    
    const nextPage = pagination.batchEndPage + 1;
    await loadPage(nextPage, filters, currentPerPage);
  }, [pagination, loadingMore, filters, currentPerPage, loadPage]);

  const goToPage = useCallback(async (page: number) => {
    if (loading) return;
    await loadPage(page, filters, currentPerPage);
  }, [loading, filters, currentPerPage, loadPage]);

  const refresh = useCallback(async () => {
    clearCache();
    await loadPage(currentPage, filters, currentPerPage, true);
  }, [clearCache, currentPage, filters, currentPerPage, loadPage]);

  const setFiltersAndReload = useCallback((newFilters: NotesReceivableFilters) => {
    setFilters(newFilters);
    clearCache();
    setCurrentPage(1);
    loadPage(1, newFilters, currentPerPage, true);
  }, [clearCache, currentPerPage, loadPage]);

  const setPerPageAndReload = useCallback((newPerPage: number) => {
    setCurrentPerPage(newPerPage);
    clearCache();
    setCurrentPage(1);
    loadPage(1, filters, newPerPage, true);
  }, [clearCache, filters, loadPage]);

  const retry = useCallback(async () => {
    await loadPage(currentPage, filters, currentPerPage, true);
  }, [currentPage, filters, currentPerPage, loadPage]);

  // Auto-fetch initial data
  useEffect(() => {
    if (enableAutoFetch && filters.startDate && filters.endDate) {
      loadPage(1, filters, currentPerPage, true);
    }
  }, []); // Only run once on mount

  return {
    // Data
    data,
    allLoadedData,
    months,
    
    // Loading states  
    loading,
    initialLoading,
    loadingMore,
    
    // Pagination
    currentPage,
    hasNextPage: pagination?.hasNextBatch || false,
    totalRecords: pagination?.totalRecords || 0,
    pagination,
    
    // Actions
    loadNextBatch,
    goToPage,
    refresh,
    setFilters: setFiltersAndReload,
    setPerPage: setPerPageAndReload,
    
    // Error handling
    error,
    retryCount,
    retry,
  };
}