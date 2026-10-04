"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import LoanApplicationQueries from '@/graphql/LoanApplicationQueries';
import { graphqlFetch } from '@/utils/graphqlFetch';
import type { ApplicationSourceCount } from '@/utils/DataTypes';
import type { DayRange } from '@/utils/sourceTracker';

const LOAD_FAILED = 'Could not load the source counts. Please try again.';

/**
 * The per-source counts for the days, or an Error whose message the page can show. The
 * server's own message is kept as it is: a reversed range or one over a year is refused
 * with a reason of its own, which is worth showing word for word.
 */
async function fetchSourceCounts({ from, to }: DayRange): Promise<ApplicationSourceCount[]> {
  const result = await graphqlFetch<{ getApplicationSourceCounts: ApplicationSourceCount[] | null }>(
    LoanApplicationQueries.GET_APPLICATION_SOURCE_COUNTS_QUERY,
    { from, to },
  );
  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || LOAD_FAILED);
  }
  const counts = result.data?.getApplicationSourceCounts;
  if (!counts) {
    throw new Error('The server returned no counts. Please retry.');
  }
  return counts;
}

/**
 * How many applications came in by each source between two days (Source tracker,
 * /applications/tracker). Loads on mount and again whenever `from` or `to` changes;
 * `refresh` loads the same days again. `counts` is null from the moment a load starts
 * until its answer arrives, so the page never shows one range's numbers under another's
 * label. Only the newest request may answer: a slow reply to an earlier range is dropped.
 * Logs carry the two dates only.
 */
const useApplicationSourceCounts = ({ from, to }: DayRange) => {
  const [counts, setCounts] = useState<ApplicationSourceCount[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latestRequest.current;
    setLoading(true);
    setError(null);
    setCounts(null);
    try {
      const found = await fetchSourceCounts({ from, to });
      if (request === latestRequest.current) setCounts(found);
    } catch (caught) {
      console.error('[useApplicationSourceCounts] the counts did not load', { from, to, caught });
      if (request === latestRequest.current) {
        setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      }
    } finally {
      if (request === latestRequest.current) setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
    // Leaving the page, or moving to other days, makes any answer still on its way stale.
    return () => {
      latestRequest.current += 1;
    };
  }, [load]);

  return { counts, loading, error, refresh: load };
};

export default useApplicationSourceCounts;
