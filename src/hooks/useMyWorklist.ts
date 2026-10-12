"use client";

import { useCallback, useEffect, useState } from 'react';
import WorklistQueries from '@/graphql/WorklistQueries';
import { graphqlFetch } from '@/utils/graphqlFetch';

export type WorklistStep = 'schedule' | 'pn' | 'bank' | 'release';

export interface WorklistLoan {
  id: string;
  borrower_name: string;
  pn_amount: string | null;
  step: WorklistStep;
  updated_at: string;
}

export interface WorklistCount {
  count: number;
  oldest_at: string | null;
}

export interface MyWorklist {
  loans: WorklistLoan[];
  loans_total: number;
  interviewed: WorklistCount | null;
  approved_no_loan: WorklistCount | null;
  undecided_borrowers: WorklistCount | null;
}

/** The "Waiting on you" panel's data, loaded once with the page; `retry` after a failure. */
const useMyWorklist = () => {
  const [data, setData] = useState<MyWorklist | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const result = await graphqlFetch(WorklistQueries.MY_WORKLIST, {});
      setData(result?.data?.myWorklist ?? null);
      if (!result?.data?.myWorklist) setFailed(true);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, failed, loading: data === null && !failed, retry: load };
};

export default useMyWorklist;
