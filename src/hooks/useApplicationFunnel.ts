"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import LoanApplicationQueries from '@/graphql/LoanApplicationQueries';
import { graphqlFetch } from '@/utils/graphqlFetch';
import { normalizeFunnel } from '@/utils/applicationFunnel';
import type { ApplicationFunnel } from '@/utils/DataTypes';
import type { DayRange } from '@/utils/sourceTracker';

const LOAD_FAILED = 'Could not load the funnel. Please try again.';

/** The funnel for the days, or an Error whose message the page can show (the server's own, kept word for word). */
async function fetchFunnel({ from, to }: DayRange): Promise<ApplicationFunnel> {
  const result = await graphqlFetch<{ getApplicationFunnel: ApplicationFunnel | null }>(
    LoanApplicationQueries.GET_APPLICATION_FUNNEL_QUERY,
    { from, to },
  );
  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || LOAD_FAILED);
  }
  const funnel = result.data?.getApplicationFunnel;
  if (!funnel) {
    throw new Error('The server returned no funnel. Please retry.');
  }
  return normalizeFunnel(funnel);
}

/**
 * The applicant funnel for the days applied between two dates (Source tracker). Loads on mount and
 * whenever `from` or `to` changes; `refresh` loads the same days again. `funnel` is null from the
 * moment a load starts until its answer arrives, and only the newest request may answer, as in
 * useApplicationSourceCounts. Logs carry the two dates only.
 */
const useApplicationFunnel = ({ from, to }: DayRange) => {
  const [funnel, setFunnel] = useState<ApplicationFunnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latestRequest.current;
    setLoading(true);
    setError(null);
    setFunnel(null);
    try {
      const found = await fetchFunnel({ from, to });
      if (request === latestRequest.current) setFunnel(found);
    } catch (caught) {
      console.error('[useApplicationFunnel] the funnel did not load', { from, to, caught });
      if (request === latestRequest.current) setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      if (request === latestRequest.current) setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
    return () => {
      latestRequest.current += 1;
    };
  }, [load]);

  return { funnel, loading, error, refresh: load };
};

export default useApplicationFunnel;
