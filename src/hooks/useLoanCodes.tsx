"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import LoanCodeQueryMutations from '@/graphql/LoanCodeQueryMutations';
import LoanClientsQueryMutations from '@/graphql/LoanClientsQueryMutations';
import { DataRowLoanCodes, DataFormLoanCodes, DataRowClientList, DataRowLoanTypeList } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";

const useLoanCodes = () => {
  const { GET_LOAN_CODE_QUERY, GET_LOAN_TYPE_QUERY, SAVE_LOAN_CODE_MUTATION, UPDATE_LOAN_CODE_MUTATION } = LoanCodeQueryMutations;
  const { GET_LOAN_CLIENT_QUERY } = LoanClientsQueryMutations;

  // const [dataUser, setDataUser] = useState<User[] | undefined>(undefined);
  const [data, setData] = useState<DataRowLoanCodes[]>([]);
  const [singleLoanCode, setSingleLoanCode] = useState<DataRowLoanCodes[]>([]);
  const [dataClients, setDataClients] = useState<DataRowClientList[]>([]);
  const [dataType, setDataType] = useState<DataRowLoanTypeList[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loanCodeLoading, setLoanCodeLoading] = useState<boolean>(false);
  const rowsPerPage = 10;
  // Function to fetchdata
  
  const fetchLoanCodes = async (orderBy = 'id_desc') => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LOAN_CODE_QUERY,
        variables: { orderBy },
      }),
    });

    const result = await response.json();
    setData(result.data.getLoanCodes);
  };
  const fetchLoanClients = async (orderBy = 'id_desc') => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LOAN_CLIENT_QUERY,
        variables: { orderBy },
      }),
    });

    const result = await response.json();
    setDataClients(result.data.getLoanClient);
  };
  
  const fetchLoanTypes = async (orderBy = 'id_desc') => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LOAN_TYPE_QUERY,
        variables: { orderBy },
      }),
    });

    const result = await response.json();
    setDataType(result.data.getLoanTypes);
  };

  const onSubmitLoanCode = async (data: DataFormLoanCodes) => {
    setLoanCodeLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];

      let mutation;
      let variables: { input: any } = {
        input: {
          code: data.code,
          description: data.description,
          loan_client_id: Number(data.loan_client_id),
          loan_type_id: Number(data.loan_type_id),
          user_id: userData?.user?.id
        },
      };

      if (data.id) {
        mutation = UPDATE_LOAN_CODE_MUTATION;
        variables.input.id = data.id;
      } else {
        mutation = SAVE_LOAN_CODE_MUTATION;
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

      // Handle GraphQL errors
      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      // Check for successful creation/update
      if (result.data?.createLoanCode || result.data?.updateLoanCode) {
        const responseData = result.data.createLoanCode || result.data.updateLoanCode;
        toast.success("Loan code saved successfully!");
        fetchLoanCodes();
        return { success: true, data: responseData };
      }

      toast.success("Loan code saved successfully!");
      fetchLoanCodes();
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoanCodeLoading(false);
    }
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchLoanCodes()
    fetchLoanClients()
    fetchLoanTypes()
  }, []);

  return {
    data,
    dataClients,
    onSubmitLoanCode,
    dataType,
    fetchLoanCodes,
    loanCodeLoading
  };
};

export default useLoanCodes;