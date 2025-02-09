"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { DataLoanProceedList, DataLoanProceedAcctData } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import LoanProceedSettingQueryMutations from '@/graphql/LoanProceedSettingQueryMutations';
import { fetchWithRecache } from '@/utils/helper';

const useLoanProceedAccount = () => {
  const { SAVE_LOAN_PROCEED_SETTINGS, GET_LOAN_PROCEED_SETTINGS } = LoanProceedSettingQueryMutations;

  const [lpsDataAccount, setLpsDataAccount] = useState<DataLoanProceedAcctData[]>();
  const [lpsSingleData, setLpsSingleData] = useState<DataLoanProceedAcctData[]>();
  const [loading, setLoading] = useState<boolean>(false);
 
  const fetchLpsDataTable = async () => {
    setLoading(true);

    let variables: { input: any } = {
      input : { branch_sub_id: "" }
    };

    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LOAN_PROCEED_SETTINGS,
        variables
      }),
    });
    // const result = await response.json();
    setLpsDataAccount(response.data.getLoanProceedSettings);
    setLpsSingleData(undefined);
    setLoading(false);
  };

  const fetchLpsDataForm = async (row: any) => {
    setLoading(true);

    let variables: { input: any } = {
      input : { branch_sub_id: String(row?.branch_sub_id) }
    };

    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LOAN_PROCEED_SETTINGS,
        variables
      }),
    });
    // const result = await response.json();
    setLpsSingleData(response.data.getLoanProceedSettings);
    setLoading(false);
  };

  const onSubmitLoanProSettings: SubmitHandler<DataLoanProceedList> = async (data) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    
    let mutation;
    let variables: { input: any } = {
      input: {
        user_id: String(userData?.user?.id),
        branch_sub_id: data?.branch_sub_id,
        description: data?.description,
        nr_id: data?.nr_id,
        ob_id: data?.ob_id,
        udi_id: data?.udi_id,
        proc_id: data?.proc_id,
        ins_id: data?.ins_id,
        col_id: data?.col_id,
        not_id: data?.not_id,
        reb_id: data?.reb_id,
        pen_id: data?.pen_id,
        addon_id: data?.addon_id,
        addon_udi_id: data?.addon_udi_id,
        cib_id: data?.cib_id
      },
    };

    // if (data.id) {
    //   mutation = UPDATE_COA_MUTATION;
    //   variables.input.id = data.id;
    // } else {
      mutation = SAVE_LOAN_PROCEED_SETTINGS;
    // }

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
    toast.success("Loan Proceed Settings is Saved!");
    console.log(result, ' result');
  };
  
  useEffect(() => {
  }, []);

  return {
    fetchLpsDataTable,
    lpsDataAccount,
    loading,
    onSubmitLoanProSettings,
    fetchLpsDataForm,
    lpsSingleData
  };
};

export default useLoanProceedAccount;