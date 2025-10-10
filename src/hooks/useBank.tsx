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
  const [loading, setLoading] = useState<boolean>(false);
  const [bankLoading, setBankLoading] = useState<boolean>(false);
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
  
  const fetchDataBank = async (first: number = 15, page: number = 1) => {
    setLoading(true);
    try {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      setDataBank(result.data.getBanks.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(`Failed to load banks: ${errorMessage}`);
      console.error('fetchDataBank error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitBank: SubmitHandler<DataBank> = async (data) => {
    setBankLoading(true);
    try {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Handle GraphQL errors
      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for successful creation/update
      if (result.data?.saveBank || result.data?.updateBank) {
        const responseData = result.data.saveBank || result.data.updateBank;
        toast.success(responseData?.message || "Bank saved successfully!");
        return { success: true, data: responseData };
      }

      toast.success("Bank saved successfully!");
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setBankLoading(false);
    }
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
    fetchDataBank(100, 1); // Smart pagination: load 15 records instead of 1000
    fetchDataSubBranch();
  }, []);

  return {
    fetchDataBank,
    dataBank,
    branchSubData,
    onSubmitBank,
    handleDeleteBank,
    loading,
    bankLoading
  };
};

export default useBank;