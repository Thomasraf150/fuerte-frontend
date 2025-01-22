"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import LoanProductsQueryMutations from '@/graphql/LoanProductsQueryMutations';
import { DataRowLoanProducts, DataFormLoanProducts } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";

const useLoanProducts = () => {
  const { GET_LOAN_PRODUCT_QUERY, SAVE_LOAN_PRODUCT_QUERY, UPDATE_LOAN_PRODUCT_QUERY } = LoanProductsQueryMutations;

  // const [dataUser, setDataUser] = useState<User[] | undefined>(undefined);
  const [data, setData] = useState<DataRowLoanProducts[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const rowsPerPage = 10;
  // Function to fetchdata
  
  const fetchLoanProducts = async (orderBy = 'id_desc') => {
    setLoading(true);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LOAN_PRODUCT_QUERY,
        variables: { orderBy },
      }),
    });

    const result = await response.json();
    setData(result.data.getLoanProducts);
    setLoading(false);
  };

  const onSubmitLoanProduct = async (data: DataFormLoanProducts) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];

    let mutation;
    let variables: { input: any } = {
      input: {
        loan_code_id: Number(data.loan_code_id),
        description: data.description, 
        terms: Number(data.terms),
        interest_rate: Number(data.interest_rate),
        udi: Number(data.udi),
        processing: Number(data.processing),
        agent_fee: Number(data.agent_fee),
        insurance: Number(data.insurance),
        collection: Number(data.collection),
        notarial: Number(data.notarial),
        // addon: Number(data.addon),
        base_deduction: Number(data.base_deduction),
        addon_terms: Number(data.addon_terms),
        addon_udi_rate: Number(data.addon_udi_rate),
        is_active: data.is_active,
        user_id: userData?.user?.id
      },
    };
    if (data.id) {
        mutation = UPDATE_LOAN_PRODUCT_QUERY;
        variables.input.id = data.id;
    } else {
      mutation = SAVE_LOAN_PRODUCT_QUERY;
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });
    const result = await response.json();
    if (result.errors) {
      toast.error(result.errors[0].message);
    } else {
      toast.success('Loan Product Saved!');
    }
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    // fetchLoanProducts()
  }, []);

  return {
    data,
    onSubmitLoanProduct,
    fetchLoanProducts,
    loading
  };
};

export default useLoanProducts;