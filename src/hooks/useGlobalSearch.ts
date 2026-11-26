"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GLOBAL_SEARCH_MIN_LENGTH,
  GLOBAL_SEARCH_MORE_LIMIT,
  GLOBAL_SEARCH_QUERY,
  type GlobalSearchResult,
} from '@/graphql/GlobalSearchQuery';
import { GraphQLConnectionError, graphqlFetch } from '@/utils/graphqlFetch';

const isDev = process.env.NODE_ENV === 'development';
const FAILED = 'Search is not available right now. Please try again.';

type Response = { data?: { globalSearch?: GlobalSearchResult }; errors?: { message?: string }[] };

/**
 * Runs the universal search for `term` (the /search page's ?q=). Nothing is asked for under
 * GLOBAL_SEARCH_MIN_LENGTH characters. A failure is a sentence for the page, never a toast, so a
 * slow reader keeps it (toasts vanish; NN/g). `showMore(key)` reloads one group with up to
 * GLOBAL_SEARCH_MORE_LIMIT rows in place.
 */
export function useGlobalSearch(term: string) {
  const [result, setResult] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [moreLoading, setMoreLoading] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<{ key: string; message: string } | null>(null);
  /** Groups already reloaded at GLOBAL_SEARCH_MORE_LIMIT: asking again returns the same rows. */
  const [expanded, setExpanded] = useState<string[]>([]);
  const trimmed = term.trim();
  /** Bumped on every new term: a Show more reply for an older term is dropped. */
  const termSeq = useRef(0);
  /** Bumped on every Show more: only the latest request may clear the spinner. */
  const moreSeq = useRef(0);

  useEffect(() => {
    termSeq.current += 1;
    setMoreLoading(null);
    setMoreError(null);
    setExpanded([]);
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
      .then((response: Response) => {
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

  const showMore = useCallback(
    async (key: string) => {
      const forTerm = termSeq.current;
      const request = ++moreSeq.current;
      const stale = () => forTerm !== termSeq.current;
      setMoreLoading(key);
      setMoreError(null);
      try {
        const response: Response = await graphqlFetch<{ globalSearch: GlobalSearchResult }>(GLOBAL_SEARCH_QUERY, {
          term: trimmed,
          group: key,
          limit: GLOBAL_SEARCH_MORE_LIMIT,
        });
        if (stale()) return;
        const more = response.data?.globalSearch?.groups.find((g) => g.key === key);
        if (response.errors?.length || !more) {
          if (isDev) console.warn('[useGlobalSearch] show more refused', { key, errors: response.errors });
          setMoreError({ key, message: response.errors?.[0]?.message || FAILED });
          return;
        }
        // Only for the same term still on screen.
        setResult((current) =>
          current && current.term === response.data?.globalSearch?.term
            ? { ...current, groups: current.groups.map((g) => (g.key === key ? more : g)) }
            : current,
        );
        setExpanded((keys) => (keys.includes(key) ? keys : [...keys, key]));
      } catch (e: unknown) {
        if (stale()) return;
        if (isDev) console.error('[useGlobalSearch] show more failed', e);
        setMoreError({ key, message: e instanceof GraphQLConnectionError ? e.message : FAILED });
      } finally {
        if (request === moreSeq.current) setMoreLoading(null);
      }
    },
    [trimmed],
  );

  return { result, loading, error, retry, showMore, moreLoading, moreError, expanded };
}
