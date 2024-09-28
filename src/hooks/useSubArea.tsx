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
  };

  const onSubmitSubArea: SubmitHandler<DataSubArea> = async (data) => {
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
    toast.success("Sub Area is Saved!");
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
    handleDeleteSubArea
  };
};

export default useSubArea;