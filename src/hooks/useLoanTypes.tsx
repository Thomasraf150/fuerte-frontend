"use client"

import { useState, useCallback } from 'react';
import LoanTypeQueryMutations from '@/graphql/LoanTypeQueryMutations';
import { DataRowLoanTypeList, DataFormLoanType } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";

const useLoanTypes = () => {
  const {
    GET_LOAN_TYPES_QUERY,
    CREATE_LOAN_TYPE_MUTATION,
    UPDATE_LOAN_TYPE_MUTATION,
    DELETE_LOAN_TYPE_MUTATION,
  } = LoanTypeQueryMutations;

  const [dataLoanTypes, setDataLoanTypes] = useState<DataRowLoanTypeList[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const getAuthHeaders = () => {
    const { GET_AUTH_TOKEN } = useAuthStore.getState();
    const token = GET_AUTH_TOKEN();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  const fetchLoanTypes = useCallback(async (orderBy = 'id_desc') => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          query: GET_LOAN_TYPES_QUERY,
          variables: { orderBy },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        console.error('Error fetching loan types:', result.errors);
        setDataLoanTypes([]);
        return;
      }

      setDataLoanTypes(result.data?.getLoanTypes ?? []);
    } catch (error) {
      console.error('Error fetching loan types:', error);
      setDataLoanTypes([]);
    } finally {
      setLoading(false);
    }
  }, [GET_LOAN_TYPES_QUERY]);

  const onSubmitLoanType = async (data: DataFormLoanType) => {
    setSubmitting(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];

      const isUpdate = !!data.id;
      const mutation = isUpdate ? UPDATE_LOAN_TYPE_MUTATION : CREATE_LOAN_TYPE_MUTATION;

      const variables: { input: any } = {
        input: {
          name: data.name,
          user_id: userData?.user?.id,
        },
      };

      if (isUpdate) {
        variables.input.id = data.id;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ query: mutation, variables }),
      });

      const result = await response.json();

      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false, error: result.errors[0].message };
      }

      toast.success(`Loan type ${isUpdate ? 'updated' : 'created'} successfully!`);
      fetchLoanTypes();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLoanType = async (id: number) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          query: DELETE_LOAN_TYPE_MUTATION,
          variables: { input: { id, is_deleted: true } },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        toast.error(result.errors[0].message);
        return { success: false };
      }

      toast.success('Loan type deleted successfully!');
      fetchLoanTypes();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    dataLoanTypes,
    loading,
    submitting,
    fetchLoanTypes,
    onSubmitLoanType,
    handleDeleteLoanType,
  };
};

export default useLoanTypes;
