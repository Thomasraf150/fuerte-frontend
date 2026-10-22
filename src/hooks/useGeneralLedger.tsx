"use client"

import { useEffect, useRef, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import GeneralLedgerQueryMutations from '@/graphql/GeneralLedgerQueryMutations';
import { RowAcctgEntry, DataGLRow } from '@/utils/DataTypes';
import { toast } from '@/utils/notify';
import moment from 'moment';
import { graphqlFetch } from '@/utils/graphqlFetch';

const useGeneralLedger = () => {

  const { GET_GL_QUERY } = GeneralLedgerQueryMutations;

  const [loading, setLoading] = useState<boolean>(false);
  const [dataGl, setDataGl] = useState<DataGLRow[]>();
  // Only the newest request may land: an older, slower one must not overwrite it
  // and leave last month's totals under this month's dates.
  const latest = useRef(0);
  // Function to fetchdata

  const fetchGL = async (startDate: string, endDate: string) => {
    // const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    // const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        startDate,
        endDate,
      },
    };

    mutation = GET_GL_QUERY;
    const mine = ++latest.current;
    setLoading(true);

    // finally, not a trailing call: a throw here used to leave `loading` true
    // forever, which the list ignored. Now that the list renders a skeleton off
    // this flag, a failed fetch would otherwise shimmer for eternity.
    try {
      const result = await graphqlFetch(mutation, variables);
      if (mine === latest.current) setDataGl(result?.data.getGL);
    } catch (error) {
      if (mine !== latest.current) return;
      toast.error('Failed to load the general ledger. Please try again.');
      setDataGl([]);
    } finally {
      if (mine === latest.current) setLoading(false);
    }
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
  }, []);

  return {
    fetchGL,
    dataGl,
    loading
  };
};

export default useGeneralLedger;