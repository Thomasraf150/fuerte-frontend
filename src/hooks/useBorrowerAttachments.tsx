"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import BorrowerQueryMutations from '@/graphql/BorrowerQueryMutations';
import { useAuthStore } from "@/store";

import { BorrAttachmentsFormValues, BorrAttachmentsRowData } from '@/utils/DataTypes';
import { toast } from "react-toastify";
const useBorrowerAttachments = () => {

  const { 
      GET_BORROWER_ATTACHMENTS_QUERY, 
      SAVE_BORROWER_ATTACHMENTS_QUERY, 
      UPDATE_BORROWER_ATTACHMENTS_QUERY } = BorrowerQueryMutations;

  const [borrowerLoading, setBorrowerLoading] = useState<boolean>(false);
  const [dataBorrAttm, setDataBorrAttm] = useState<BorrAttachmentsRowData[]>([]);
  
  // Function to fetchdata
  const onSubmitBorrAttm: SubmitHandler<BorrAttachmentsFormValues> = async (data) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    const formData = new FormData();
    formData.append('operations', JSON.stringify({
      query: SAVE_BORROWER_ATTACHMENTS_QUERY,
      variables: {
        input: {
          id: data.id,
          borrower_id: data.borrower_id,
          file_type: data.file_type,
          user_id: userData?.user?.id
        },
        file: null,
      },
    }));
    formData.append('map', JSON.stringify({ 'file': ['variables.file'] }));
    formData.append('file', data.file[0]);
    // console.log(formData, ' formData')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    console.log(result, ' result');
    toast.success("Borrower is Saved!");
  };
  
  const fetchDataBorrAttachments = async (first: number, page: number, borrower_id: number) => {
    setBorrowerLoading(true);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_BORROWER_ATTACHMENTS_QUERY,
        variables: { first, page, orderBy: [
          { column: "id", order: 'DESC' }
        ],
        borrower_id
      },
      }),
    });

    const result = await response.json();
    // console.log(result, ' result')
    setBorrowerLoading(false);
    setDataBorrAttm(result.data.getBorrAttachments.data);
  };

  const handleDeleteAttm = async (row: any) => {
    // setBorrowerLoading(true);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: UPDATE_BORROWER_ATTACHMENTS_QUERY,
        variables: { 
          input: {
            id: row.id, 
            is_deleted: true
          } 
        },
      }),
    });

    const result = await response.json();
    toast.success("Deleted Successfully!");
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    // fetchDataBorrAttachments(100, 1);
    // fetchDataArea(100, 1);
    // fetchDataSubArea(10, 1);
  }, []);

  return {
    fetchDataBorrAttachments,
    onSubmitBorrAttm,
    dataBorrAttm,
    borrowerLoading,
    handleDeleteAttm
  };
};

export default useBorrowerAttachments;