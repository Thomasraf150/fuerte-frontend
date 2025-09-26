"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import ChiefQueryMutations from '@/graphql/ChiefQueryMutations';

import { DataChief } from '@/utils/DataTypes';
import { toast } from "react-toastify";
const useChiefs = () => {

  const { GET_CHIEF_QUERY,
          SAVE_CHIEF_MUTATION,
          UPDATE_CHIEF_MUTATION,
          DELETE_CHIEF_MUTATION } = ChiefQueryMutations;
  
  const [dataChief, setDataChief] = useState<DataChief[] | undefined>(undefined);
  const [chiefLoading, setChiefLoading] = useState<boolean>(false);
  const [chiefFetchLoading, setChiefFetchLoading] = useState<boolean>(false);
  // Function to fetchdata
  const fetchDataChief = async (first: number, page: number) => {
    setChiefFetchLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_CHIEF_QUERY,
          variables: { first, page, orderBy: [
            { column: "id", order: 'DESC' }
          ] 
        },
        }),
      });

      const result = await response.json();
      setDataChief(result.data.getChief.data);
    } catch (error) {
      console.error('fetchDataChief error:', error);
    } finally {
      setChiefFetchLoading(false);
    }
  };

  const onSubmitChief: SubmitHandler<DataChief> = async (data) => {
    setChiefLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];

      let mutation;
      let variables: { input: any } = {
        input: {
          name: data.name,
          address: data.address,
          contact_no: data.contact_no,
          email: data.email,
          user_id: userData?.user?.id
        },
      };

      if (data.id) {
        mutation = UPDATE_CHIEF_MUTATION;
        variables.input.id = data.id;
      } else {
        mutation = SAVE_CHIEF_MUTATION;
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
      if (result.data?.createChief || result.data?.updateChief) {
        const responseData = result.data.createChief || result.data.updateChief;
        toast.success("Chief saved successfully!");
        return { success: true, data: responseData };
      }

      toast.success("Chief saved successfully!");
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setChiefLoading(false);
    }
  };
  
  const handleDeleteChief = async (data: any) => {
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
        query: DELETE_CHIEF_MUTATION,
        variables
      }),
    });
    const result = await response.json();
    toast.success("Chief is Deleted!");
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchDataChief(10, 1);
  }, []);

  return {
    fetchDataChief,
    dataChief,
    onSubmitChief,
    handleDeleteChief,
    chiefLoading,
    chiefFetchLoading
  };
};

export default useChiefs;