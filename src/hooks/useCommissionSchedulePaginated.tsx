"use client"

import { useEffect, useState, useCallback, useRef } from 'react';
import CommissionScheduleQueryMutations from '@/graphql/CommissionScheduleQueryMutations';
import { toast } from "react-toastify";
import moment from 'moment';

interface CSTransPerMonth {
  month: string;
  commission_collected: string;
}

interface CSData {
  loan_ref: string;
  firstname: string;
  middlename: string;
  lastname: string;
  released_date: string;
  from: string;
  to: string;
  pn_amount: string;
  terms: string;
  trans_per_month: CSTransPerMonth[];
}

interface CSPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  has_more_pages: boolean;
}

interface CSProps {
  data: CSData[];
  months: string[];
  pagination: CSPagination;
}

interface CacheEntry {
  data: CSProps;
  timestamp: number;
  searchTerm: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const useCommissionSchedulePaginated = () => {
  const { CS_SCHEDULE_BATCH } = CommissionScheduleQueryMutations;
  
  // State management
  const [allData, setAllData] = useState<CSData[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [pagination, setPagination] = useState<CSPagination>({
    current_page: 1,
    per_page: 20,
    total: 0,
    last_page: 1,
    has_more_pages: false
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Refs for cleanup and debouncing
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  
  // Constants
  const SEARCH_DEBOUNCE_MS = 500;
  const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  const MAX_CACHE_ENTRIES = 20;
  
  // Cache management
  const generateCacheKey = useCallback((
    startDate: Date | undefined, 
    endDate: Date | undefined, 
    searchTerm: string, 
    page: number
  ): string => {
    const key = JSON.stringify({
      startDate: startDate ? moment(startDate).format('YYYY-MM-DD') : null,
      endDate: endDate ? moment(endDate).format('YYYY-MM-DD') : null,
      searchTerm: searchTerm.trim(),
      page
    });
    return btoa(key); // Base64 encode for cleaner cache keys
  }, []);
  
  const getCachedData = useCallback((cacheKey: string): CacheEntry | null => {
    const cached = cacheRef.current.get(cacheKey);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION_MS;
    if (isExpired) {
      cacheRef.current.delete(cacheKey);
      return null;
    }
    
    return cached;
  }, []);
  
  const setCachedData = useCallback((
    cacheKey: string, 
    data: CSProps, 
    searchTerm: string,
    startDate: Date | undefined,
    endDate: Date | undefined
  ): void => {
    // Implement LRU eviction
    if (cacheRef.current.size >= MAX_CACHE_ENTRIES) {
      const firstKey = cacheRef.current.keys().next().value;
      if (firstKey) {
        cacheRef.current.delete(firstKey);
      }
    }
    
    cacheRef.current.set(cacheKey, {
      data,
      timestamp: Date.now(),
      searchTerm,
      startDate,
      endDate
    });
  }, []);

  // Main fetch function
  const fetchCommissionScheduleBatch = useCallback(async (
    startDate: Date | undefined,
    endDate: Date | undefined,
    searchTerm: string = '',
    page: number = 1,
    resetData: boolean = false
  ): Promise<void> => {
    // Input validation
    if (!startDate || !endDate) {
      console.warn('Commission Schedule: Start date and end date are required');
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Check cache first
    const cacheKey = generateCacheKey(startDate, endDate, searchTerm, page);
    const cachedResult = getCachedData(cacheKey);
    
    if (cachedResult && page === 1) {
      console.log('Commission Schedule: Serving from cache', { searchTerm, page });
      
      if (resetData) {
        setAllData(cachedResult.data.data);
      } else {
        setAllData(prev => page === 1 ? cachedResult.data.data : [...prev, ...cachedResult.data.data]);
      }
      
      setMonths(cachedResult.data.months);
      setPagination(cachedResult.data.pagination);
      return;
    }

    setLoading(true);
    if (page === 1) {
      setIsSearching(true);
    }

    try {
      const variables = {
        input: {
          startDate: moment(startDate).format('YYYY-MM-DD'),
          endDate: moment(endDate).format('YYYY-MM-DD'),
          searchTerm: searchTerm.trim(),
          page,
          perPage: 20,
          pagesPerBatch: 1
        }
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: CS_SCHEDULE_BATCH,
          variables,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Check for GraphQL errors
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        throw new Error(result.errors[0]?.message || 'GraphQL error occurred');
      }

      const commissionScheduleData = result.data?.getCommissionScheduleBatch;
      
      if (!commissionScheduleData) {
        throw new Error('No commission schedule data received');
      }

      // Update state
      if (resetData || page === 1) {
        setAllData(commissionScheduleData.data || []);
      } else {
        setAllData(prev => [...prev, ...(commissionScheduleData.data || [])]);
      }
      
      setMonths(commissionScheduleData.months || []);
      setPagination(commissionScheduleData.pagination || {
        current_page: 1,
        per_page: 20,
        total: 0,
        last_page: 1,
        has_more_pages: false
      });

      // Cache successful result for page 1
      if (page === 1) {
        setCachedData(cacheKey, commissionScheduleData, searchTerm, startDate, endDate);
      }

      console.log('Commission Schedule: Data loaded successfully', {
        searchTerm,
        page,
        totalRecords: commissionScheduleData.pagination?.total || 0
      });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Commission Schedule: Request was cancelled');
        return;
      }

      console.error('Error fetching commission schedule:', error);
      toast.error(`Failed to load commission schedule: ${error.message}`);
      
      // Reset data on error for first page
      if (page === 1) {
        setAllData([]);
        setMonths([]);
        setPagination({
          current_page: 1,
          per_page: 20,
          total: 0,
          last_page: 1,
          has_more_pages: false
        });
      }
    } finally {
      setLoading(false);
      setIsSearching(false);
      abortControllerRef.current = null;
    }
  }, [CS_SCHEDULE_BATCH, generateCacheKey, getCachedData, setCachedData]);

  // Debounced search function
  const debouncedFetch = useCallback((
    startDate: Date | undefined,
    endDate: Date | undefined,
    searchTerm: string,
    resetData: boolean = true
  ) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchCommissionScheduleBatch(startDate, endDate, searchTerm, 1, resetData);
    }, SEARCH_DEBOUNCE_MS);
  }, [fetchCommissionScheduleBatch]);

  // Load more data function
  const loadMoreData = useCallback((
    startDate: Date | undefined,
    endDate: Date | undefined,
    currentSearchTerm: string = ''
  ) => {
    if (!pagination.has_more_pages || loading) {
      return;
    }

    const nextPage = pagination.current_page + 1;
    fetchCommissionScheduleBatch(startDate, endDate, currentSearchTerm, nextPage, false);
  }, [fetchCommissionScheduleBatch, pagination, loading]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // Data
    dataCommissionSched: allData,
    months,
    pagination,
    
    // Loading states
    loading,
    isSearching,
    
    // Search
    searchTerm,
    setSearchTerm,
    
    // Functions
    fetchCommissionScheduleBatch,
    debouncedFetch,
    loadMoreData,
    cleanup
  };
};

export default useCommissionSchedulePaginated;