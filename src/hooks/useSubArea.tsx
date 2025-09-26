"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import AreaSubAreaQueryMutations from '@/graphql/AreaSubAreaQueryMutations';

import { DataArea, DataSubArea } from '@/utils/DataTypes';
import { toast } from "react-toastify";
const useSubArea = () => {

  const { GET_AREA_QUERY, 
          GET_SUB_AREA_QUERY,
          SAVE_SUB_AREA_MUTATION,
          UPDATE_SUB_AREA_MUTATION,
          DELETE_SUB_AREA_MUTATION } = AreaSubAreaQueryMutations;
  
  const [dataArea, setDataArea] = useState<DataArea[] | undefined>(undefined);
  const [dataSubArea, setDataSubArea] = useState<DataSubArea[] | undefined>(undefined);
  const [subAreaLoading, setSubAreaLoading] = useState<boolean>(false);
  const [subAreaFetchLoading, setSubAreaFetchLoading] = useState<boolean>(false);
  // Function to fetchdata

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
  
  const fetchDataSubArea = async (first: number, page: number) => {
    setSubAreaFetchLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_SUB_AREA_QUERY,
          variables: { first, page, orderBy: [
            { column: "id", order: 'DESC' }
          ] 
        },
        }),
      });

      const result = await response.json();
      setDataSubArea(result.data.getSubAreas.data);
    } catch (error) {
      console.error('fetchDataSubArea error:', error);
    } finally {
      setSubAreaFetchLoading(false);
    }
  };

  const onSubmitSubArea: SubmitHandler<DataSubArea> = async (data) => {
    setSubAreaLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];

      let mutation;
      let variables: { input: any } = {
        input: {
          area_id: data.area_id,
          name: data.name,
        },
      };

      if (data.id) {
        mutation = UPDATE_SUB_AREA_MUTATION;
        variables.input.id = data.id;
      } else {
        mutation = SAVE_SUB_AREA_MUTATION;
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
      if (result.data?.createSubArea || result.data?.updateSubArea) {
        const responseData = result.data.createSubArea || result.data.updateSubArea;
        toast.success("Sub Area saved successfully!");
        return { success: true, data: responseData };
      }

      toast.success("Sub Area saved successfully!");
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSubAreaLoading(false);
    }
  };
  
  const handleDeleteSubArea = async (data: any) => {
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
        query: DELETE_SUB_AREA_MUTATION,
        variables
      }),
    });
    const result = await response.json();
    toast.success("Sub Area is Deleted!");
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchDataArea(10, 1);
    fetchDataSubArea(10, 1);
  }, []);

  return {
    fetchDataArea,
    dataArea,
    fetchDataSubArea,
    dataSubArea,
    onSubmitSubArea,
    handleDeleteSubArea,
    subAreaLoading,
    subAreaFetchLoading
  };
};

export default useSubArea;