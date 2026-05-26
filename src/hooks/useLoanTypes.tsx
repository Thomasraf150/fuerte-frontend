"use client"

import { useState, useCallback } from 'react';
import LoanTypeQueryMutations from '@/graphql/LoanTypeQueryMutations';
import { DataRowLoanTypeList, DataFormLoanType } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { graphqlFetch } from '@/utils/graphqlFetch';
import { useDeleteWithApproval } from '@/hooks/useDeleteWithApproval';

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

  const fetchLoanTypes = useCallback(async (orderBy = 'id_desc') => {
    setLoading(true);
    try {
      const result = await graphqlFetch(GET_LOAN_TYPES_QUERY, { orderBy });

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

      const result = await graphqlFetch(mutation, variables);

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

  const submitDeleteLoanType = useDeleteWithApproval<{ id: number }>({
    mutation: DELETE_LOAN_TYPE_MUTATION,
    responseKey: 'deleteLoanType',
    promptTitle: 'Delete this loan type?',
    promptText: 'Loan types are system-wide. Only admins or owners can approve deletion requests.',
    buildVariables: (args, reason) => ({ input: { id: args.id, is_deleted: true, reason } }),
    errorLabel: 'Failed to delete loan type',
  });

  const handleDeleteLoanType = async (
    id: number,
    onAfterRequest?: () => Promise<void> | void,
  ) => {
    setSubmitting(true);
    try {
      await submitDeleteLoanType(
        { id },
        { onAfterRequest, onImmediateSuccess: fetchLoanTypes }
      );
      return { success: true };
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
