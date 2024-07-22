"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import BorrowerQueryMutations from '@/graphql/BorrowerQueryMutations';
import { useAuthStore } from "@/store";

import { BorrowerDataAttachments } from '@/utils/DataTypes';
import { toast } from "react-toastify";
const useBorrowerAttachments = () => {

  const { GET_BORROWER_ATTACHMENTS_QUERY } = BorrowerQueryMutations;

  const [borrowerLoading, setBorrowerLoading] = useState<boolean>(false);
  
  // Function to fetchdata
  const onSubmitBorrower: SubmitHandler<BorrowerDataAttachments> = async (data) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    if (data.id) {
      // mutation = SAVE_BORROWER_MUTATION;
    } else {
      // mutation = SAVE_BORROWER_MUTATION;
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // query: mutation,
        // variables,
      }),
    });
    const result = await response.json();
    toast.success("Borrower is Saved!");
  };
  
  const fetchDataBorrAttachments = async (first: number, page: number) => {
    // setBorrowerLoading(true);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_BORROWER_ATTACHMENTS_QUERY,
        variables: { first, page, orderBy: [
          { column: "id", order: 'DESC' }
        ] 
      },
      }),
    });

    const result = await response.json();
    console.log(result, ' result')
    // setBorrowerLoading(false);
    // setDataBorrower(result.data.getBorrowers.data);
  };
  
  // const handleDeleteSubArea = async (data: any) => {
  //   let variables: { input: any } = {
  //     input: {
  //       id: data.id,
  //       is_deleted: 1,
  //     },
  //   };
  //   const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       // query: DELETE_SUB_AREA_MUTATION,
  //       variables
  //     }),
  //   });
  //   const result = await response.json();
  //   toast.success("Sub Area is Deleted!");
  // };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchDataBorrAttachments(100, 1);
    // fetchDataArea(100, 1);
    // fetchDataSubArea(10, 1);
  }, []);

  return {
    fetchDataBorrAttachments
  };
};

export default useBorrowerAttachments;