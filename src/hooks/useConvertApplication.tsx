"use client";

import { useEffect, useMemo, useState } from 'react';
import LoanApplicationQueries from '@/graphql/LoanApplicationQueries';
import { fromApplicationRecord } from '@/utils/applicationForm';
import { fetchBranchAccess } from '@/utils/branchAccess';
import {
  applicationIdFromSearch, branchChoicesFor, isNotFoundMessage, notConvertibleReason, type ApplicationConversion, type ConversionBlock,
} from '@/utils/convertApplication';
import type { BorrowerInfo, LoanApplicationRecord, SelectOption } from '@/utils/DataTypes';
import { graphqlFetch } from '@/utils/graphqlFetch';

const LOAD_FAILED = 'Could not load the application. Please try again.';

/**
 * Where Create as borrower stands (New Borrower, /borrowers/new?application=<id>):
 *   reading    the URL has not been read yet (also the server render);
 *   off        no usable ?application=: New Borrower as it always is;
 *   loading    the application is being fetched (and, for anyone but the Owner, the user's branches);
 *   ready      it can become a borrower: the form opens on it;
 *   blocked    it cannot yet (see ConversionBlock): a card says why, instead of the form;
 *   not-found  the server has no such application for this user;
 *   failed     the load did not finish: `message` is fit to show, and retry loads again.
 */
export type ConversionState =
  | { kind: 'reading' }
  | { kind: 'off' }
  | { kind: 'loading'; id: number }
  | { kind: 'ready'; id: number; record: LoanApplicationRecord; branchSubId: number }
  | { kind: 'blocked'; id: number; reason: ConversionBlock }
  | { kind: 'not-found'; id: number }
  | { kind: 'failed'; id: number; message: string };

/** The states that show a card (or an error) in place of the form. */
export type StopState = Extract<ConversionState, { kind: 'blocked' | 'not-found' | 'failed' }>;

export const isStop = (state: ConversionState): state is StopState =>
  state.kind === 'blocked' || state.kind === 'not-found' || state.kind === 'failed';

/**
 * Loads one application and says what New Borrower should do with it. Never throws: a
 * failure is a state, with words fit to show. Logs carry the id only: the record holds
 * a name, a mobile number and an address.
 *
 * The user's branches load alongside it: an application on a branch the user may not file
 * borrowers under is stopped here, before anything is typed. The server refuses it only at the
 * save, after the photo is stored and left orphaned. A list that does not load stops nobody
 * (fetchBranchAccess answers "unknown"): the server still refuses.
 */
async function loadConversion(id: number): Promise<ConversionState> {
  const access = fetchBranchAccess();
  try {
    const result = await graphqlFetch<{ getLoanApplication: LoanApplicationRecord | null }>(
      LoanApplicationQueries.GET_LOAN_APPLICATION_QUERY,
      { id },
    );
    const refusal = result.errors?.[0]?.message;
    if (refusal) {
      if (isNotFoundMessage(refusal)) return { kind: 'not-found', id };
      // The server's messages are client-safe (graphqlFetch has already put a failed rule's reasons in this one).
      console.warn('[useConvertApplication] the server refused to give the application', { id, refusal });
      return { kind: 'failed', id, message: refusal };
    }
    const record = result.data?.getLoanApplication;
    if (!record) return { kind: 'not-found', id };
    const reason = notConvertibleReason(record, await access);
    return reason
      ? { kind: 'blocked', id, reason }
      : { kind: 'ready', id, record, branchSubId: Number(record.branch_sub_id) };
  } catch (error) {
    // graphqlFetch's own errors (no connection, a server error page) carry a message fit to show.
    console.error('[useConvertApplication] the application did not load', { id, error });
    return { kind: 'failed', id, message: error instanceof Error ? error.message : LOAD_FAILED };
  }
}

/**
 * Create as borrower. When `enabled` (New Borrower, not an existing borrower) and the URL
 * carries a usable ?application=<id>, loads that application. The URL is read once, on
 * mount, from window.location: useSearchParams fails `next build` on Next 14.2.3 without a
 * <Suspense> boundary.
 *
 * While `ready`, `initialValues` is the form's starting values, `conversion` what the save
 * adds, and `branchChoices` the Branch picker's one choice (the application's branch, which
 * locks the picker to it). All three are stable between renders, as the form reads them once.
 */
const useConvertApplication = (enabled: boolean) => {
  const [state, setState] = useState<ConversionState>({ kind: 'reading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const id = enabled ? applicationIdFromSearch(window.location.search) : null;
    if (id === null) {
      setState({ kind: 'off' });
      return;
    }
    let stale = false; // a newer run (Retry, or React's dev double mount) has taken over
    setState({ kind: 'loading', id });
    loadConversion(id).then((next) => {
      if (!stale) setState(next);
    });
    return () => {
      stale = true;
    };
  }, [enabled, attempt]);

  const initialValues = useMemo<Partial<BorrowerInfo> | undefined>(
    () => (state.kind === 'ready' ? fromApplicationRecord(state.record) : undefined),
    [state],
  );
  const conversion = useMemo<ApplicationConversion | undefined>(
    () => (state.kind === 'ready' ? { applicationId: state.id, branchSubId: state.branchSubId } : undefined),
    [state],
  );
  const branchChoices = useMemo<SelectOption[] | undefined>(
    () => (state.kind === 'ready' ? branchChoicesFor(state.record, state.branchSubId) : undefined),
    [state],
  );

  return {
    state,
    /** Nothing to show yet: the URL is unread, or the application is loading. */
    pending: state.kind === 'reading' || state.kind === 'loading',
    /** Whether Retry has been pressed: whatever a retried load shows (the banner, the new alert's Retry button if it fails again, or the card it finds) takes the focus the old Retry button has just lost. */
    retried: attempt > 0,
    initialValues,
    conversion,
    branchChoices,
    retry: () => setAttempt((n) => n + 1),
  };
};

export default useConvertApplication;
