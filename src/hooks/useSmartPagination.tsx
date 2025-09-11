"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';

interface PaginationInfo {
  currentBatch: number;
  totalBatches: number;
  batchStartPage: number;
  batchEndPage: number;
  totalRecords: number;
  hasNextBatch: boolean;
}

interface BatchData<T> {
  data: T[];
  pagination: PaginationInfo;
  loadedAt?: number;
}

interface SmartPaginationOptions {
  perPage: number;
  pagesPerBatch: number;
  maxCachedBatches: number;
}

interface SmartPaginationReturn<T> {
  data: T[];
  allLoadedData: T[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  loading: boolean;
  prefetching: boolean;
  navigateToPage: (page: number) => void;
  refresh: () => void;
  setPerPage: (perPage: number) => void;
}

export function useSmartPagination<T>(
  fetchBatch: (page: number, perPage: number, pagesPerBatch: number) => Promise<BatchData<T>>,
  options: SmartPaginationOptions
): SmartPaginationReturn<T> {
  const { perPage: initialPerPage, pagesPerBatch, maxCachedBatches } = options;
  
  const [perPage, setPerPageState] = useState(initialPerPage);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [prefetching, setPrefetching] = useState(false);
  const [batchCache, setBatchCache] = useState<Map<string, BatchData<T>>>(new Map());
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const getCacheKey = useCallback((page: number, perPageVal: number) => 
    `${page}-${perPageVal}-${pagesPerBatch}`, [pagesPerBatch]);

  const getBatchStartPage = useCallback((page: number) => 
    Math.floor((page - 1) / pagesPerBatch) * pagesPerBatch + 1, [pagesPerBatch]);

  const loadBatch = useCallback(async (page: number, isRefresh = false) => {
    const batchStartPage = getBatchStartPage(page);
    const cacheKey = getCacheKey(batchStartPage, perPage);
    
    if (!isRefresh && batchCache.has(cacheKey)) {
      return batchCache.get(cacheKey)!;
    }

    try {
      setLoading(true);
      const batchData = await fetchBatch(batchStartPage, perPage, pagesPerBatch);
      
      const updatedCache = new Map(batchCache);
      updatedCache.set(cacheKey, { ...batchData, loadedAt: Date.now() });
      
      if (updatedCache.size > maxCachedBatches) {
        const oldestKey = Array.from(updatedCache.keys())[0];
        updatedCache.delete(oldestKey);
      }
      
      setBatchCache(updatedCache);
      setTotalRecords(batchData.pagination.totalRecords);
      setTotalPages(Math.ceil(batchData.pagination.totalRecords / perPage));
      
      return batchData;
    } catch (error) {
      console.error('Error loading batch:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchBatch, perPage, pagesPerBatch, maxCachedBatches, batchCache, getBatchStartPage, getCacheKey]);

  const currentBatchData = useMemo(() => {
    const batchStartPage = getBatchStartPage(currentPage);
    const cacheKey = getCacheKey(batchStartPage, perPage);
    return batchCache.get(cacheKey);
  }, [currentPage, perPage, batchCache, getBatchStartPage, getCacheKey]);

  const data = useMemo(() => {
    if (!currentBatchData) return [];
    const indexInBatch = (currentPage - currentBatchData.pagination.batchStartPage) * perPage;
    return currentBatchData.data.slice(indexInBatch, indexInBatch + perPage);
  }, [currentBatchData, currentPage, perPage]);

  const allLoadedData = useMemo(() => {
    return Array.from(batchCache.values())
      .sort((a, b) => a.pagination.batchStartPage - b.pagination.batchStartPage)
      .flatMap(batch => batch.data);
  }, [batchCache]);

  const hasNextPage = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);

  const navigateToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }, [totalPages]);

  const refresh = useCallback(() => {
    setBatchCache(new Map());
    loadBatch(currentPage, true);
  }, [currentPage, loadBatch]);

  const setPerPage = useCallback((newPerPage: number) => {
    setBatchCache(new Map()); // Clear cache when changing perPage
    setPerPageState(newPerPage);
    setCurrentPage(1); // Reset to first page
  }, []);

  // Load initial data and handle page changes
  useEffect(() => {
    loadBatch(currentPage);
  }, [currentPage, perPage]);

  // Prefetch next batch if needed
  useEffect(() => {
    if (currentBatchData?.pagination.hasNextBatch && !prefetching) {
      const nextBatchStartPage = currentBatchData.pagination.batchEndPage + 1;
      const nextCacheKey = getCacheKey(nextBatchStartPage, perPage);
      
      if (!batchCache.has(nextCacheKey)) {
        setPrefetching(true);
        loadBatch(nextBatchStartPage).finally(() => setPrefetching(false));
      }
    }
  }, [currentBatchData, prefetching, loadBatch, batchCache, getCacheKey, perPage]);

  return {
    data,
    allLoadedData,
    currentPage,
    totalPages,
    totalRecords,
    hasNextPage,
    loading,
    prefetching,
    navigateToPage,
    refresh,
    setPerPage,
  };
}