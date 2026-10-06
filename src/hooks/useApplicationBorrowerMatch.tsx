"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import LoanApplicationQueries from '@/graphql/LoanApplicationQueries';
import { graphqlFetch } from '@/utils/graphqlFetch';
import type { LoanApplicationBorrowerMatch } from '@/utils/DataTypes';

/** What the user is told when the server gave no reason of its own. */
const CHECK_FAILED = 'Could not check for an existing borrower. Please try again.';

/**
 * What the check knows so far: nothing yet, an answer (null when there is nothing to warn about),
 * or that it could not tell. `viaRetry` marks the answer a Retry asked for.
 */
type Outcome =
  | { kind: 'unknown' }
  | { kind: 'answered'; match: LoanApplicationBorrowerMatch | null; viaRetry: boolean }
  | { kind: 'failed' };

const UNKNOWN: Outcome = { kind: 'unknown' };

/** One check's result, as the page reads it. */
export interface BorrowerMatchCheck {
  /** What matched, once the server has said; null while it has not, when nothing matched, and when no check is made. */
  match: LoanApplicationBorrowerMatch | null;
  /** The check could not be made. That is not "no match": the page says so, and offers Retry. */
  failed: boolean;
  /**
   * The answer on screen is the one a Retry asked for: the Retry button the keyboard was on has
   * gone with the note, so the page must put the focus somewhere. True for that answer only; the
   * next check, a re-check after a save, makes it false again.
   */
  viaRetry: boolean;
  /** A check is out. After a failure the note stays on screen until it answers. */
  checking: boolean;
  retry: () => void;
}

/**
 * The server's answer, or an Error. An answer without the field is not "no match", it is a
 * response to retry (as for the application itself). Null means there is nothing to show.
 */
async function fetchBorrowerMatch(id: number): Promise<LoanApplicationBorrowerMatch | null> {
  const result = await graphqlFetch<{ getLoanApplicationBorrowerMatch?: LoanApplicationBorrowerMatch | null }>(
    LoanApplicationQueries.GET_LOAN_APPLICATION_BORROWER_MATCH_QUERY,
    { id },
  );
  if (result.errors?.length) throw new Error(result.errors[0]?.message || CHECK_FAILED);
  const data = result.data;
  if (!data || !('getLoanApplicationBorrowerMatch' in data)) throw new Error(CHECK_FAILED);
  return data.getLoanApplicationBorrowerMatch ?? null;
}

/**
 * Whether the applicant of /applications/[id] is already a borrower in Fuerte (the New
 * Borrower name check, run on the server across all branches). It is a warning for staff and
 * never blocks anything.
 *
 * Asked once when `enabled` first holds (the record has loaded and the application is not a
 * borrower yet; Call Center is asked too, and every match it gets is "elsewhere"), again after
 * each saved edit (`saves`: the name or the mobile number may have been corrected), and on
 * retry. The answer on screen stays
 * until the next one replaces it, so a re-check does not flicker. An answer that arrives after
 * the page has moved on is dropped. Logs carry the id only: a name or a mobile number is
 * never in them. `viaRetry` tells the answer to a Retry from every other.
 */
const useApplicationBorrowerMatch = (applicationId: number | null, enabled: boolean, saves: number): BorrowerMatchCheck => {
  const [outcome, setOutcome] = useState<Outcome>(UNKNOWN);
  const [checking, setChecking] = useState(false);
  const [retries, setRetries] = useState(0);
  const latest = useRef(0);
  // Set by retry(), taken by the check it starts: a ref, so a re-check after a save cannot inherit it.
  const retryAsked = useRef(false);

  useEffect(() => {
    if (!enabled || applicationId === null) {
      setOutcome(UNKNOWN);
      setChecking(false);
      return;
    }
    const request = ++latest.current;
    const viaRetry = retryAsked.current;
    retryAsked.current = false;
    setChecking(true);
    fetchBorrowerMatch(applicationId).then(
      (match) => {
        if (request !== latest.current) return;
        setOutcome({ kind: 'answered', match, viaRetry });
        setChecking(false);
      },
      (failure: unknown) => {
        if (request !== latest.current) return;
        console.warn('[useApplicationBorrowerMatch] the check did not go through', {
          id: applicationId,
          message: failure instanceof Error ? failure.message : String(failure),
        });
        setOutcome({ kind: 'failed' });
        setChecking(false);
      },
    );
    return () => {
      latest.current += 1;
    };
  }, [applicationId, enabled, saves, retries]);

  const retry = useCallback(() => {
    retryAsked.current = true;
    setRetries((count) => count + 1);
  }, []);

  return {
    match: outcome.kind === 'answered' ? outcome.match : null,
    failed: outcome.kind === 'failed',
    viaRetry: outcome.kind === 'answered' && outcome.viaRetry,
    checking,
    retry,
  };
};

export default useApplicationBorrowerMatch;
