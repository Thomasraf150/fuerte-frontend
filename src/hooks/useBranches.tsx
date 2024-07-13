"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import BranchQueryMutations from '@/graphql/BranchQueryMutation';

import { DataBranches, DataFormBranch, AuthStoreData, DataSubBranches, DataFormSubBranches } from '@/utils/DataTypes';
import { toast } from "react-toastify";
const useBranches = () => {
  const { 
    SAVE_BRANCH_MUTATION, 
    GET_BRANCH_QUERY, 
    UPDATE_BRANCH_MUTATION, 
    GET_SUB_BRANCH_QUERY, 
    SAVE_SUB_BRANCH_MUTATION, 
    UPDATE_SUB_BRANCH_MUTATION,
    DELETE_BRANCH_MUTATION,
    DELETE_SUB_BRANCH_MUTATION } = BranchQueryMutations;
  const [dataBranch, setDataBranch] = useState<DataBranches[] | undefined>(undefined);
  const [dataBranchSub, setDataBranchSub] = useState<DataSubBranches[] | undefined>(undefined);
  const [selectedBranchID, setSelectedBranchID] = useState<number>();
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
    setSelectedBranchID(branch_id)
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

  const handleDeleteBranch = async (id: number) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: DELETE_BRANCH_MUTATION,
        variables: { id },
      }),
    });
    const result = await response.json();
    if (result.data.createBranch?.name !== null) {
      await fetchDataList();
    }
    toast.success("Branche Deleted!");
  };
  
  const handleDeleteSubBranch = async (id: number) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: DELETE_SUB_BRANCH_MUTATION,
        variables: { id },
      }),
    });
    const result = await response.json();
    if (result.data.createBranch?.name !== null) {
      await fetchDataList();
    }
    toast.success("Branche Deleted!");
  };
  
  const onSubmitSubBranch: SubmitHandler<DataFormSubBranches> = async (data) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];

    let mutation;
    let variables: { input: any } = {
      input: {
        code: data.code,
        name: data.name,
        address: data.address,
        branch_id: Number(data.branch_id),
        contact_no: data.contact_no,
        head_contact: data.head_contact,
        head_email: data.head_email,
        head_name: data.head_name,
        ref_ctr_year: Number(data.ref_ctr_year),
        ref_current_value: Number(data.ref_current_value),
        ref_no_length: Number(data.ref_no_length),
        user_id: userData?.user?.id
      },
    };

    if (data.id) {
      mutation = UPDATE_SUB_BRANCH_MUTATION;
      variables.input.id = data.id;
    } else {
      mutation = SAVE_SUB_BRANCH_MUTATION;
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
    toast.success("Branches Sub Saved!");
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
    fetchSubDataList,
    selectedBranchID,
    onSubmitSubBranch,
    handleDeleteBranch,
    handleDeleteSubBranch
  };
};

export default useBranches;