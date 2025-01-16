"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { DataChartOfAccountList, DataSubBranches } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import CoaQueryMutations from '@/graphql/CoaQueryMutations';
import BranchQueryMutation from '@/graphql/BranchQueryMutation';
import { fetchWithRecache } from '@/utils/helper';

const useCoa = () => {
  const { COA_TABLE_QUERY } = CoaQueryMutations;
  const { GET_ALL_SUB_BRANCH_QUERY } = BranchQueryMutation;

  const [coaDataAccount, setCoaDataAccount] = useState<DataChartOfAccountList[]>();
  const [loading, setLoading] = useState<boolean>(false);
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
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];

    let mutation;
    let variables: { input: any } = {
      input: {
        branch_sub_id: data.branch_sub_id,
        name: data.account_name,
        description: data.description,
        user_id: userData?.user?.id,
        is_debit: data.is_debit 
      },
    };

    // if (data.id) {
    //   mutation = UPDATE_AREA_MUTATION;
    //   variables.input.id = data.id;
    // } else {
    //   mutation = SAVE_AREA_MUTATION;
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
    toast.success("Coa is Saved!");
  };
  
  useEffect(() => {
    fetchDataSubBranch();
  }, []);

  return {
    fetchCoaDataTable,
    coaDataAccount,
    branchSubData,
    fetchDataSubBranch,
    onSubmitCoa
  };
};

export default useCoa;