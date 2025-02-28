"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import GeneralJournalQueryMutations from '@/graphql/GeneralJournalQueryMutations';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';

const useGeneralVoucher = () => {

  const { GET_GJ_QUERY } = GeneralJournalQueryMutations;

  const [loading, setLoading] = useState<boolean>(false);
  const [dataGj, setDataGj] = useState<RowAcctgEntry[]>();
  // Function to fetchdata

  const fetchGJ = async (branch_sub_id: string, startDate: string, endDate: string, j_type: string) => {
    // const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    // const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        branch_sub_id,
        startDate,
        endDate,
        j_type
      },
    };

    mutation = GET_GJ_QUERY;
    setLoading(true);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });
    const result = await response.json();
    setDataGj(result?.data.getJournal);
    setLoading(false);
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
  }, []);

  return {
    fetchGJ,
    dataGj,
    loading
  };
};

export default useGeneralVoucher;