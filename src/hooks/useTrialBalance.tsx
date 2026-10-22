"use client"

import { useEffect, useRef, useState } from 'react';
import TrialBalanceQueryMutations from '@/graphql/TrialBalanceQueryMutations';
import { DataTbRow } from '@/utils/DataTypes';
import { toast } from '@/utils/notify';
import { graphqlFetch } from '@/utils/graphqlFetch';
import { manilaToday } from '@/utils/reportPeriod';

/**
 * The trial balance "as of" a day (inclusive), opening on today. A trial balance is
 * cumulative, so only the end day is sent; the server totals every posting up to it.
 * Before 2026-10-12 the page sent empty dates and the server ignored them anyway.
 */
const useTrialBalance = () => {

  const { GET_UTB } = TrialBalanceQueryMutations;

  const [loading, setLoading] = useState<boolean>(false);
  const [dataUtb, setDataUtb] = useState<DataTbRow>();
  const [asOf, setAsOf] = useState<string>(() => manilaToday());
  // Only the newest request may land: an older, slower one must not overwrite it
  // and leave one day's totals under another day's heading.
  const latest = useRef(0);

  const fetchUtb = async (branch_sub_id: string, endDate: string) => {
    const mine = ++latest.current;
    setLoading(true);
    // finally, so a failed request cannot leave the skeleton shimmering forever.
    try {
      const result = await graphqlFetch(GET_UTB, { input: { endDate, branch_sub_id } });
      if (mine === latest.current) setDataUtb(result?.data.getUnadjustedTBal);
    } catch (error) {
      if (mine !== latest.current) return;
      toast.error('Failed to load the trial balance. Please try again.');
      setDataUtb(undefined);
    } finally {
      if (mine === latest.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUtb('', asOf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asOf]);

  return {
    dataUtb,
    loading,
    asOf,
    setAsOf,
  };
};

export default useTrialBalance;
