"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import AreaSubAreaQueryMutations from '@/graphql/AreaSubAreaQueryMutations';
import BranchQueryMutation from '@/graphql/BranchQueryMutation';

import { DataArea, DataSubBranches } from '@/utils/DataTypes';
import { toast } from "react-toastify";
const useArea = () => {

  const { GET_AREA_QUERY,
          SAVE_AREA_MUTATION,
          UPDATE_AREA_MUTATION,
          DELETE_AREA_MUTATION } = AreaSubAreaQueryMutations;
  const { GET_ALL_SUB_BRANCH_QUERY } = BranchQueryMutation;
  
  const [dataArea, setDataArea] = useState<DataArea[] | undefined>(undefined);
  const [branchSubData, setBranchSubData] = useState<DataSubBranches[] | undefined>(undefined);
  // Function to fetchdata
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
  
  const fetchDataArea = async (first: number, page: number) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_AREA_QUERY,
        variables: { first, page, orderBy: [
          { column: "id", order: 'DESC' }
        ] 
      },
      }),
    });

    const result = await response.json();
    setDataArea(result.data.getAreas.data);
  };

  const onSubmitArea: SubmitHandler<DataArea> = async (data) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];

    let mutation;
    let variables: { input: any } = {
      input: {
        branch_sub_id: data.branch_sub_id,
        name: data.name,
        description: data.description,
        user_id: userData?.user?.id
      },
    };

    if (data.id) {
      mutation = UPDATE_AREA_MUTATION;
      variables.input.id = data.id;
    } else {
      mutation = SAVE_AREA_MUTATION;
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
    toast.success("Area is Saved!");
  };
  
  const handleDeleteArea = async (data: any) => {
    let variables: { input: any } = {
      input: {
        id: data.id,
        is_deleted: 1,
      },
    };
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: DELETE_AREA_MUTATION,
        variables
      }),
    });
    const result = await response.json();
    toast.success("Area is Deleted!");
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchDataArea(10, 1);
    fetchDataSubBranch();
  }, []);

  return {
    fetchDataArea,
    dataArea,
    branchSubData,
    onSubmitArea,
    handleDeleteArea
  };
};

export default useArea;