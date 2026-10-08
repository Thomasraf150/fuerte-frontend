"use client";

import { useCallback, useEffect, useState } from 'react';
import { GLOBAL_SEARCH_MIN_LENGTH, GLOBAL_SEARCH_QUERY, type GlobalSearchResult } from '@/graphql/GlobalSearchQuery';
import { GraphQLConnectionError, graphqlFetch } from '@/utils/graphqlFetch';

const isDev = process.env.NODE_ENV === 'development';
const FAILED = 'Search is not available right now. Please try again.';

/**
 * Runs the universal search for `term` (the /search page's ?q=). Nothing is asked for under
 * GLOBAL_SEARCH_MIN_LENGTH characters. A failure is a sentence for the page, never a toast, so a
 * slow reader keeps it (toasts vanish; NN/g).
 */
export function useGlobalSearch(term: string) {
  const [result, setResult] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const trimmed = term.trim();

  useEffect(() => {
    if (trimmed.length < GLOBAL_SEARCH_MIN_LENGTH) {
      setResult(null);
      setError(null);
      return;
    }
    let cancelled = false;
    // A new term never shows the previous term's rows under it.
    setResult(null);
    setLoading(true);
    setError(null);
    graphqlFetch<{ globalSearch: GlobalSearchResult }>(GLOBAL_SEARCH_QUERY, { term: trimmed })
      .then((response) => {
        if (cancelled) return;
        if (response.errors?.length || !response.data?.globalSearch) {
          if (isDev) console.warn('[useGlobalSearch] refused', { errors: response.errors });
          setError(response.errors?.[0]?.message || FAILED);
          setResult(null);
          return;
        }
        setResult(response.data.globalSearch);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (isDev) console.error('[useGlobalSearch] failed', e);
        setError(e instanceof GraphQLConnectionError ? e.message : FAILED);
        setResult(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trimmed, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { result, loading, error, retry };
}
