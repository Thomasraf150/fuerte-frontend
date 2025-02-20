"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import GeneralVoucherQueryMutations from '@/graphql/GeneralVoucherQueryMutations';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';

const useGeneralVoucher = () => {

  const { CREATE_CV_MUTATION } = GeneralVoucherQueryMutations;

  const [loading, setLoading] = useState<boolean>(false);
  const [dataAcctgEntry, setDataAcctgEntry] = useState<RowAcctgEntry>();
  // Function to fetchdata

  const fetchAcctgEntries = async (vendor_type_id: string) => {
    // const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    // const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        vendor_type_id
      },
    };

    // mutation = GET_VENDOR_LIST_QUERY;
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
    // setDataAcctgEntry(result?.data.getDataAcctgEntry);
    setLoading(false);
  };

  const createGV = async (row: RowAcctgEntry) => {
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
        check_no: row?.check_no,
        journal_desc: row?.journal_desc,
        acctg_details: row?.acctg_details
      },
    };

    mutation = CREATE_CV_MUTATION;
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
    toast.success(result?.data.createCvEntry?.message);
    setLoading(false);
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
  }, []);

  return {
    createGV,
    loading
  };
};

export default useGeneralVoucher;