"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import LoanProductsQueryMutations from '@/graphql/LoanProductsQueryMutations';
import { DataRowLoanProducts, BorrLoanComputationValues } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import LoansQueryMutation from '@/graphql/LoansQueryMutation';

const useLoans = () => {
  const { GET_LOAN_PRODUCT_QUERY, SAVE_LOAN_PRODUCT_QUERY, UPDATE_LOAN_PRODUCT_QUERY } = LoanProductsQueryMutations;
  const { PROCESS_BORROWER_LOAN_MUTATION } = LoansQueryMutation;

  // const [dataUser, setDataUser] = useState<User[] | undefined>(undefined);
  const [loanProduct, setLoanProduct] = useState<DataRowLoanProducts[]>([]);
  const [dataComputedLoans, setDataComputedLoans] = useState<[]>([]);
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
    setLoanProduct(result.data.getLoanProducts);
    setLoading(false);
  };

  const onSubmitLoanComp = async (data: BorrLoanComputationValues, process_type: string) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];

    let variables: { input: any, process_type: string } = {
      input: {
        loan_proceeds: data.loan_proceeds,
        branch_sub_id: data.branch_sub_id,
        loan_product_id: data.loan_product_id,
        ob: data.ob,
        penalty: data.penalty,
        rebates: data.rebates
      },
      process_type
    };
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: PROCESS_BORROWER_LOAN_MUTATION,
        variables,
      }),
    });
    const result = await response.json();
    console.log(result, ' result')
    setDataComputedLoans(result.data.processALoan);
    // if (result.errors) {
    //   toast.error(result.errors[0].message);
    // } else {
    //   toast.success('Loan Product Saved!');
    // }
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchLoanProducts()
  }, []);

  return {
    onSubmitLoanComp,
    loanProduct,
    dataComputedLoans
  };
};

export default useLoans;