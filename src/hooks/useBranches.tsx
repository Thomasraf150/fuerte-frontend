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
  const [branchLoading, setBranchLoading] = useState<boolean>(false);
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
    setBranchLoading(true);
    try {
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

      // Handle GraphQL errors
      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for successful creation/update
      if (result.data?.createBranch || result.data?.updateBranch) {
        const responseData = result.data.createBranch || result.data.updateBranch;
        await fetchDataList();
        toast.success("Branch saved successfully!");
        return { success: true, data: responseData };
      }

      toast.success("Branch saved successfully!");
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setBranchLoading(false);
    }
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
    setBranchLoading(true);
    try {
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

      // Handle GraphQL errors
      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for successful creation/update
      if (result.data?.createBranchSub || result.data?.updateBranchSub) {
        const responseData = result.data.createBranchSub || result.data.updateBranchSub;
        toast.success("Sub-branch saved successfully!");
        return { success: true, data: responseData };
      }

      toast.success("Sub-branch saved successfully!");
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setBranchLoading(false);
    }
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
    handleDeleteSubBranch,
    branchLoading
  };
};

export default useBranches;