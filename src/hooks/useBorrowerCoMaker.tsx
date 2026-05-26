"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import BorrowerQueryMutations from '@/graphql/BorrowerQueryMutations';
import { graphqlFetch } from '@/utils/graphqlFetch';

import { BorrCoMakerFormValues, BorrCoMakerRowData } from '@/utils/DataTypes';
import { toast } from "react-toastify";
const useBorrowerCoMaker = () => {

  const { GET_BORROWER_CO_MAKER,
          SAVE_BORROWER_CO_MAKER,
          DELETE_BORROWER_CO_MAKER } = BorrowerQueryMutations;

  const [borrowerLoading, setBorrowerLoading] = useState<boolean>(false);
  const [dataBorrCoMaker, setDataBorrCoMaker] = useState<BorrCoMakerRowData[]>([]);
  
  // Function to fetchdata
  const onSubmitBorrCoMaker: SubmitHandler<BorrCoMakerFormValues> = async (data) => {
    setBorrowerLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];

      const result = await graphqlFetch(SAVE_BORROWER_CO_MAKER, {
        input: {
          id: data.id,
          borrower_id: data.borrower_id,
          user_id: userData?.user?.id,
          name: data.name,
          relationship: data.relationship,
          marital_status: data.marital_status,
          address: data.address,
          birthdate: data.birthdate,
          contact_no: data.contact_no,
        },
      });

      // Handle GraphQL errors
      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for successful co-maker save
      if (result.data?.saveBorrowerCoMaker) {
        toast.success("Borrower Comaker is Saved!");
        return { success: true, data: result.data.saveBorrowerCoMaker };
      }

      toast.success("Borrower Comaker is Saved!");
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setBorrowerLoading(false);
    }
  };
  
  const fetchDataBorrCoMaker = async (first: number, page: number, borrower_id: number) => {
    setBorrowerLoading(true);
    const result = await graphqlFetch(GET_BORROWER_CO_MAKER, {
      first,
      page,
      orderBy: [{ column: "id", order: 'DESC' }],
      borrower_id,
    });
    // console.log(result, ' result')
    setBorrowerLoading(false);
    setDataBorrCoMaker(result.data.getBorrCoMaker.data);
  };

  const handleDeleteComaker = async (row: any) => {
    // setBorrowerLoading(true);
    const result = await graphqlFetch(DELETE_BORROWER_CO_MAKER, {
      input: {
        id: row.id,
        is_deleted: true,
      },
    });
    toast.success("Deleted Successfully!");
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    // fetchDataBorrCoMaker(100, 1);
    // fetchDataArea(100, 1);
    // fetchDataSubArea(10, 1);
  }, []);

  return {
    fetchDataBorrCoMaker,
    onSubmitBorrCoMaker,
    dataBorrCoMaker,
    borrowerLoading,
    handleDeleteComaker
  };
};

export default useBorrowerCoMaker;