"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import BorrowerCompaniesQueryMutations from '@/graphql/BorrowerCompaniesQueryMutations';

import { DataBorrCompanies } from '@/utils/DataTypes';
import { toast } from "react-toastify";
const useBorrCompanies = () => {

  const { GET_BORROWER_COMPANIES, SAVE_BORROWER_COMPANIES, UPDATE_BORROWER_COMPANIES, DELETE_BORR_COMP_MUTATION } = BorrowerCompaniesQueryMutations;
  
  const [dataBorrComp, setDataBorrComp] = useState<DataBorrCompanies[] | undefined>(undefined);
  // Function to fetchdata
  const fetchDataBorrComp = async (first: number, page: number) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_BORROWER_COMPANIES,
        variables: { first, page, orderBy: [
          { column: "id", order: 'DESC' }
        ] 
      },
      }),
    });

    const result = await response.json();
    setDataBorrComp(result.data.getBorrCompanies.data);
  };

  const onSubmitBorrComp: SubmitHandler<DataBorrCompanies> = async (data) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];

    let mutation;
    let variables: { input: any } = {
      input: {
        name: data.name,
        address: data.address,
        contact_person: data.contact_person,
        contact_no: data.contact_no,
        contact_email: data.contact_email,
        user_id: userData?.user?.id
      },
    };

    if (data.id) {
      mutation = UPDATE_BORROWER_COMPANIES;
      variables.input.id = data.id;
    } else {
      mutation = SAVE_BORROWER_COMPANIES;
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
    console.log(result, ' result');
  };
  
  const handleDeleteBranch = async (data: any) => {
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
        query: DELETE_BORR_COMP_MUTATION,
        variables
      }),
    });
    const result = await response.json();
    toast.success("Borrower Company is Deleted!");
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchDataBorrComp(10, 1);
  }, []);

  return {
    fetchDataBorrComp,
    dataBorrComp,
    onSubmitBorrComp,
    handleDeleteBranch
  };
};

export default useBorrCompanies;