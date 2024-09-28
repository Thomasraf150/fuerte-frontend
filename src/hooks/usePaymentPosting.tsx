"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import LoanProductsQueryMutations from '@/graphql/LoanProductsQueryMutations';
import { BorrLoanRowData, CollectionFormValues } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import PaymentPostingQueryMutation from '@/graphql/PaymentPostingQueryMutation';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { fetchWithRecache } from '@/utils/helper';

const usePaymentPosting = () => {
  const { LOANS_LIST_QUERY, GET_LOAN_SCHEDULE, PROCESS_COLLECTION_PAYMENT } = PaymentPostingQueryMutation;

  const [loanData, setLoanData] = useState<BorrLoanRowData[]>([]);
  const [loanScheduleList, setLoanScheduleList] = useState<BorrLoanRowData>();
  const [loading, setLoading] = useState<boolean>(false);

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
    if (response.errors) {
      toast.error(response.errors[0].message);
    } else {
      toast.success('Payment Entry Saved!');
      fetchLoanSchedule(loan_id);
    }
  };
  
   // Fetch data on component mount if id exists
  useEffect(() => {
  }, []);

  return {
    loading,
    fetchLoans,
    loanData,
    onSubmitCollectionPayment,
    fetchLoanSchedule,
    loanScheduleList
  };
};

export default usePaymentPosting;