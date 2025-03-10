"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import AdjustingEntriesQueryMutations from '@/graphql/AdjustingEntriesQueryMutations';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';

const useAdjustingEntries = () => {

  const { GET_AE_QUERY, CREATE_AE_MUTATION } = AdjustingEntriesQueryMutations;

  const [loading, setLoading] = useState<boolean>(false);
  const [dataAe, setDataAe] = useState<RowAcctgEntry[]>();
  // Function to fetchdata

  const fetchAe = async (branch_sub_id: string, startDate: string, endDate: string) => {
    // const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    // const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        branch_sub_id,
        startDate,
        endDate
      },
    };

    mutation = GET_AE_QUERY;
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
    setDataAe(result?.data.getAdjustingEntries);
    setLoading(false);
  };

  const createAe = async (row: RowAcctgEntry) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        id: row?.id,
        user_id: String(userData?.user?.id),
        journal_date: row?.journal_date,
        vendor_id: row?.vendor_id,
        journal_name: row?.journal_name,
        reference_no: row?.reference_no,
        check_no: row?.check_no,
        journal_desc: row?.journal_desc,
        acctg_details: row?.acctg_details
      },
    };

    mutation = CREATE_AE_MUTATION;
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
    toast.success(result?.data.createAeEntry?.message);
    setLoading(false);
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchAe("","","");
  }, []);

  return {
    createAe,
    fetchAe,
    dataAe,
    loading
  };
};

export default useAdjustingEntries;