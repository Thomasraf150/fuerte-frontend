"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import LoanProductsQueryMutations from '@/graphql/LoanProductsQueryMutations';
import { DataRowLoanProducts, BorrLoanComputationValues, BorrLoanRowData, LoanBankFormValues, LoanReleaseFormValues } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import PaymentPostingQueryMutation from '@/graphql/PaymentPostingQueryMutation';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { fetchWithRecache } from '@/utils/helper';

const useLoans = () => {
  const { LOANS_LIST_QUERY, GET_LOAN_SCHEDULE } = PaymentPostingQueryMutation;

  const [loanData, setLoanData] = useState<BorrLoanRowData[]>([]);
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

  
   // Fetch data on component mount if id exists
  useEffect(() => {
  }, []);

  return {
    loading,
    fetchLoans,
    loanData
  };
};

export default useLoans;