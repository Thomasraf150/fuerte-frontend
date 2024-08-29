"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import BankQueryMutations from '@/graphql/BankQueryMutations';
import BranchQueryMutation from '@/graphql/BranchQueryMutation';

import { DataBank, DataSubBranches } from '@/utils/DataTypes';
import { toast } from "react-toastify";
const useBank = () => {

  const { GET_BANKS_QUERY, UPDATE_BANK_MUTATION, SAVE_BANK_MUTATION, DELETE_BANK_MUTATION } = BankQueryMutations;
  const { GET_ALL_SUB_BRANCH_QUERY } = BranchQueryMutation;
  
  const [dataBank, setDataBank] = useState<DataBank[] | undefined>(undefined);
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
  
  const fetchDataBank = async (first: number, page: number) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_BANKS_QUERY,
        variables: { first, page, orderBy: [
          { column: "id", order: 'DESC' }
        ] 
      },
      }),
    });

    const result = await response.json();
    setDataBank(result.data.getBanks.data);
  };

  const onSubmitBank: SubmitHandler<DataBank> = async (data) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];

    let mutation;
    let variables: { input: any } = {
      input: {
        branch_sub_id: String(data.branch_sub_id),
        name: data.name,
        address: data.address, 
        phone: data.phone, 
        contact_person: data.contact_person, 
        mobile: data.mobile, 
        email: data.email, 
        user_id: userData?.user?.id
      },
    };

    if (data.id) {
      mutation = UPDATE_BANK_MUTATION;
      variables.input.id = data.id;
    } else {
      mutation = SAVE_BANK_MUTATION;
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
    toast.success("Bank is Saved!");
  };
  
  const handleDeleteBank = async (data: any) => {
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
        query: DELETE_BANK_MUTATION,
        variables
      }),
    });
    const result = await response.json();
    toast.success("Bank is Deleted!");
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchDataBank(1000, 1);
    fetchDataSubBranch();
  }, []);

  return {
    fetchDataBank,
    dataBank,
    branchSubData,
    onSubmitBank,
    handleDeleteBank
  };
};

export default useBank;