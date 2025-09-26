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
  const [loanProcLoading, setLoanProcLoading] = useState<boolean>(false);
 
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

  const onSubmitLoanProSettings = async (data: DataLoanProceedList, handleRefetchData: () => void) => {
    setLoanProcLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];
      
      let mutation;
      let variables: { input: any } = {
        input: {
          user_id: String(userData?.user?.id),
          branch_sub_id: data?.branch_sub_id,
          loan_ref: data?.loan_ref,
          description: data?.description,
          nr_id: data?.nr_id,
          ob_id: data?.ob_id,
          udi_id: data?.udi_id,
          proc_id: data?.proc_id,
          ins_id: data?.ins_id,
          ins_mfee_id: data?.ins_mfee_id,
          col_id: data?.col_id,
          not_id: data?.not_id,
          reb_id: data?.reb_id,
          pen_id: data?.pen_id,
          addon_id: data?.addon_id,
          addon_udi_id: data?.addon_udi_id,
          cib_id: data?.cib_id
        },
      };

      mutation = SAVE_LOAN_PROCEED_SETTINGS;

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

      // Handle GraphQL errors
      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for successful creation
      if (result?.data?.createLoanProceedSettings) {
        const responseData = result.data.createLoanProceedSettings;
        toast.success(responseData.message || "Loan proceed settings saved successfully!");
        handleRefetchData();
        return { success: true, data: responseData };
      }

      toast.success("Loan proceed settings saved successfully!");
      handleRefetchData();
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoanProcLoading(false);
    }
  };
  
  useEffect(() => {
  }, []);

  return {
    fetchLpsDataTable,
    lpsDataAccount,
    loading,
    onSubmitLoanProSettings,
    fetchLpsDataForm,
    lpsSingleData,
    loanProcLoading
  };
};

export default useLoanProceedAccount;