"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import TrialBalanceQueryMutations from '@/graphql/TrialBalanceQueryMutations';
import { DataTbRow } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';

const useTrialBalance = () => {

  const { GET_UTB } = TrialBalanceQueryMutations;

  const [loading, setLoading] = useState<boolean>(false);
  const [dataUtb, setDataUtb] = useState<DataTbRow>();
  // Function to fetchdata

  const fetchUtb = async (branch_sub_id: String, startDate: string, endDate: string) => {
    // const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    // const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        startDate,
        endDate,
        branch_sub_id
      },
    };

    mutation = GET_UTB;
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
    setDataUtb(result?.data.getUnadjustedTBal);
    setLoading(false);
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchUtb("", "", "");
  }, []);

  return {
    dataUtb,
    loading
  };
};

export default useTrialBalance;