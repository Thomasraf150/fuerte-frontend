"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import LoanProductsQueryMutations from '@/graphql/LoanProductsQueryMutations';
import { BorrLoanRowData, CollectionFormValues, OtherCollectionFormValues } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import PaymentPostingQueryMutation from '@/graphql/PaymentPostingQueryMutation';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { fetchWithRecache } from '@/utils/helper';

const usePaymentPosting = () => {
  const { LOANS_LIST_QUERY, GET_LOAN_SCHEDULE, PROCESS_COLLECTION_PAYMENT, PROCESS_COLLECTION_OTHER_PAYMENT, PROCESS_REMOVE_POSTED_PAYMENT } = PaymentPostingQueryMutation;

  const [loanData, setLoanData] = useState<BorrLoanRowData[]>([]);
  const [loanScheduleList, setLoanScheduleList] = useState<BorrLoanRowData>();
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);

  // Function to fetchdata
  
  const fetchLoans = async (first: number, page: number, borrower_id: number) => {
    setLoading(true);
    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: LOANS_LIST_QUERY,
        variables: { first, page, orderBy: [
          { column: "id", order: 'DESC' }
        ], borrower_id}
      }),
    });

    // const result = await response.json();
    setLoanData(response.data.getLoanListPymntPosting.data);
    setLoading(false);
  };
  
  const fetchLoanSchedule = async (loan_id: string) => {
    setLoading(true);

    let variables: { input: any } = {
      input : { loan_id: loan_id }
    };

    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LOAN_SCHEDULE,
        variables
      }),
    });

    // const result = await response.json();
    setLoanScheduleList(response.data.getLoanSchedule);
    setLoading(false);
  };

  const onSubmitCollectionPayment = async (data: CollectionFormValues, loan_id: string) => {
    setPaymentLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];

      let variables: { input: any } = {
        input: {
          user_id: String(userData?.user?.id),
          loan_schedule_id: data.loan_schedule_id,
          loan_udi_schedule_id: data.loan_udi_schedule_id,
          collection: data.collection,
          penalty: data.penalty,
          bank_charge: data.bank_charge,
          ap_refund: data.ap_refund,
          interest: data.interest,
          ua_sp: data.ua_sp,
          commission_fee: data.commission_fee,
          collection_date: data.collection_date,
        }
      };

      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: PROCESS_COLLECTION_PAYMENT,
          variables,
        }),
      });

      // Handle GraphQL errors
      if (response.errors) {
        toast.error(response.errors[0].message);
        return { success: false, error: response.errors[0].message };
      }

      // Check for successful payment processing
      if (response.data?.processCollectionPayment) {
        toast.success('Payment Entry Saved!');
        fetchLoanSchedule(loan_id);
        return { success: true, data: response.data.processCollectionPayment };
      }

      toast.success('Payment Entry Saved!');
      fetchLoanSchedule(loan_id);
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setPaymentLoading(false);
    }
  };
  
  const fnReversePayment = async (data: any, loan_id: string) => {
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];

      let variables: { input: any } = {
        input: {
          user_id: String(userData?.user?.id),
          loan_schedule_id: String(data.id)
        }
      };

      const isConfirmed = await showConfirmationModal(
        'Are you sure to reverse this payment?',
        'You won\'t be able to revert this!',
        'Yes it is!',
      );

      if (!isConfirmed) {
        return { success: false, error: 'Operation cancelled by user' };
      }

      setPaymentLoading(true);

      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: PROCESS_REMOVE_POSTED_PAYMENT,
          variables,
        }),
      });

      // Handle GraphQL errors
      if (response.errors) {
        toast.error(response.errors[0].message);
        return { success: false, error: response.errors[0].message };
      }

      // Check for successful payment reversal
      if (response.data?.processRemovePostedPayment) {
        toast.success('Payment Successfully Reversed!');
        fetchLoanSchedule(loan_id);
        return { success: true, data: response.data.processRemovePostedPayment };
      }

      toast.success('Payment Successfully Reversed!');
      fetchLoanSchedule(loan_id);
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setPaymentLoading(false);
    }
  };
  
  const onSubmitOthCollectionPayment = async (data: OtherCollectionFormValues, loan_id: string) => {
    setPaymentLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];

      let variables: { input: any } = {
        input: {
          user_id: String(userData?.user?.id),
          loan_schedule_id: data.loan_schedule_id,
          loan_udi_schedule_id: data.loan_udi_schedule_id,
          collection: data.collection,
          penalty: data.penalty,
          bank_charge: data.bank_charge,
          ap_refund: data.ap_refund,
          interest: data.interest,
          commission_fee: data.commission_fee,
          collection_date: data.collection_date,
          advanced_payment: data.advanced_payment || "0.00",
          payment_ua_sp: data.payment_ua_sp || "0.00",
          penalty_ua_sp: data.penalty_ua_sp || "0.00"
        }
      };

      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: PROCESS_COLLECTION_OTHER_PAYMENT,
          variables,
        }),
      });

      // Handle GraphQL errors
      if (response.errors) {
        toast.error(response.errors[0].message);
        return { success: false, error: response.errors[0].message };
      }

      // Check for successful payment processing
      if (response.data?.processCollectionOtherPayment) {
        toast.success('Payment Entry Saved!');
        fetchLoanSchedule(loan_id);
        return { success: true, data: response.data.processCollectionOtherPayment };
      }

      toast.success('Payment Entry Saved!');
      fetchLoanSchedule(loan_id);
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setPaymentLoading(false);
    }
  };
  
   // Fetch data on component mount if id exists
  useEffect(() => {
  }, []);

  return {
    loading,
    paymentLoading,
    fetchLoans,
    loanData,
    onSubmitCollectionPayment,
    fetchLoanSchedule,
    loanScheduleList,
    onSubmitOthCollectionPayment,
    fnReversePayment
  };
};

export default usePaymentPosting;