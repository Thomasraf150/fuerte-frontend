"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import BranchMutations from '@/graphql/BranchMutation';

import { DataBranches, DataFormBranch, AuthStoreData, DataSubBranches } from '@/utils/DataTypes';
import { toast } from "react-toastify";
const useBranches = () => {
  const { SAVE_BRANCH_MUTATION, GET_BRANCH_QUERY, UPDATE_BRANCH_MUTATION, GET_SUB_BRANCH_QUERY } = BranchMutations;
  const [dataBranch, setDataBranch] = useState<DataBranches[] | undefined>(undefined);
  const [dataBranchSub, setDataBranchSub] = useState<DataSubBranches[] | undefined>(undefined);
  // Function to fetchdata
  const fetchDataList = async (orderBy = 'id_desc') => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_BRANCH_QUERY,
        variables: { orderBy },
      }),
    });

    const result = await response.json();
    setDataBranch(result.data.getBranch);
  };

  const fetchSubDataList = async (orderBy = 'id_desc', branch_id: number) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_SUB_BRANCH_QUERY,
        variables: { orderBy, branch_id },
      }),
    });

    const result = await response.json();
    setDataBranchSub(result.data.getBranchSub);
  };

  const onSubmitBranch: SubmitHandler<DataFormBranch> = async (data) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];

    let mutation;
    let variables: { input: any } = {
      input: {
        name: data.name,
        user_id: userData?.user?.id
      },
    };

    if (data.id) {
      mutation = UPDATE_BRANCH_MUTATION;
      variables.input.id = data.id;
    } else {
      mutation = SAVE_BRANCH_MUTATION;
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
    if (result.data.createBranch?.name !== null) {
      await fetchDataList();
    }
    toast.success("Branches Saved!");
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchDataList()
  }, []);

  return {
    dataBranch,
    dataBranchSub,
    onSubmitBranch,
    fetchDataList,
    fetchSubDataList
  };
};

export default useBranches;