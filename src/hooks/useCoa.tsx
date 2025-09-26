"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { DataChartOfAccountList, DataSubBranches } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import CoaQueryMutations from '@/graphql/CoaQueryMutations';
import BranchQueryMutation from '@/graphql/BranchQueryMutation';
import { fetchWithRecache } from '@/utils/helper';

const useCoa = () => {
  const { COA_TABLE_QUERY, UPDATE_COA_MUTATION, SAVE_COA_MUTATION } = CoaQueryMutations;
  const { GET_ALL_SUB_BRANCH_QUERY } = BranchQueryMutation;

  const [coaDataAccount, setCoaDataAccount] = useState<DataChartOfAccountList[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [coaLoading, setCoaLoading] = useState<boolean>(false);
  const [branchSubData, setBranchSubData] = useState<DataSubBranches[] | undefined>(undefined);

  const fetchDataSubBranch = async (orderBy = 'id_desc') => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_ALL_SUB_BRANCH_QUERY,
        variables: { orderBy } 
      }),
    });

    const result = await response.json();
    setBranchSubData(result.data.getAllBranch);
  };
  
  const fetchCoaData = async (orderBy = 'id_desc') => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_ALL_SUB_BRANCH_QUERY,
        variables: { orderBy } 
      }),
    });

    const result = await response.json();
    setBranchSubData(result.data.getAllBranch);
  };

  const fetchCoaDataTable = async () => {
    setLoading(true);

    let variables: { input: any } = {
      input : { startDate: "", endDate: "" }
    };

    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: COA_TABLE_QUERY,
        variables
      }),
    });
    // const result = await response.json();
    setCoaDataAccount(response.data.getChartOfAccounts);
    setLoading(false);
  };

  const onSubmitCoa: SubmitHandler<DataChartOfAccountList> = async (data) => {
    setCoaLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];
      
      let mutation;
      let variables: { input: any } = {
        input: {
          user_id: String(userData?.user?.id),
          branch_sub_id: data.branch_sub_id,
          account_name: data.account_name,
          description: data.description,
          is_debit: data.is_debit,
          balance: data.balance,
          parent_account_id: data.parent_account_id,
        },
      };

      if (data.id) {
        mutation = UPDATE_COA_MUTATION;
        variables.input.id = data.id;
      } else {
        mutation = SAVE_COA_MUTATION;
      }

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

      // Check for successful creation/update
      if (result.data?.createCoa || result.data?.updateCoa) {
        const responseData = result.data.createCoa || result.data.updateCoa;
        toast.success("Chart of Account saved successfully!");
        return { success: true, data: responseData };
      }

      toast.success("Chart of Account saved successfully!");
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setCoaLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDataSubBranch();
  }, []);

  return {
    fetchCoaDataTable,
    coaDataAccount,
    branchSubData,
    fetchDataSubBranch,
    onSubmitCoa,
    coaLoading
  };
};

export default useCoa;