"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import LoanProductsQueryMutations from '@/graphql/LoanProductsQueryMutations';
import { DataRowLoanProducts, BorrLoanComputationValues, BorrLoanRowData, LoanBankFormValues, LoanReleaseFormValues } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import LoansQueryMutation from '@/graphql/LoansQueryMutation';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { fetchWithRecache } from '@/utils/helper';

const useLoans = () => {
  const { GET_LOAN_PRODUCT_QUERY, SAVE_LOAN_PRODUCT_QUERY, UPDATE_LOAN_PRODUCT_QUERY } = LoanProductsQueryMutations;
  const { BORROWER_LOAN_QUERY, 
          PROCESS_BORROWER_LOAN_MUTATION, 
          APPROVE_LOAN_BY_SCHEDULE, 
          BORROWER_SINGLE_LOAN_QUERY, 
          LOAN_PN_SIGNING, 
          SAVE_LOAN_BANK_DETAILS,
          SAVE_LOAN_RELEASE,
          PRINT_LOAN_DETAILS } = LoansQueryMutation;

  // const [dataUser, setDataUser] = useState<User[] | undefined>(undefined);
  const [loanProduct, setLoanProduct] = useState<DataRowLoanProducts[]>([]);
  const [loanData, setLoanData] = useState<BorrLoanRowData[]>([]);
  const [loanSingleData, setLoanSingleData] = useState<BorrLoanRowData>();
  const [dataComputedLoans, setDataComputedLoans] = useState<[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const rowsPerPage = 10;
  // Function to fetchdata
  
  const fetchLoans = async (first: number, page: number, borrower_id: number) => {
    setLoading(true);
    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: BORROWER_LOAN_QUERY,
        variables: { first, page, orderBy: [
          { column: "id", order: 'DESC' }
        ], borrower_id}
      }),
    });

    // const result = await response.json();
    setLoanData(response.data.getLoans.data);
    setLoading(false);
  };
  
  const fetchSingLoans = async (loan_id: number) => {
    setLoading(true);
    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: BORROWER_SINGLE_LOAN_QUERY,
        variables: { loan_id }
      }),
    });

    // const result = await response.json();
    setLoanSingleData(response.data.getLoan);
    setLoading(false);
  };
  
  const fetchLoanProducts = async (orderBy = 'id_desc') => {
    setLoading(true);
    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LOAN_PRODUCT_QUERY,
        variables: { orderBy },
      }),
    });

    // const result = await response.json();
    setLoanProduct(response.data.getLoanProducts);
    setLoading(false);
  };

  const printLoanDetails = async (loan_id: string) => {
    try {
      setLoading(true);
      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: PRINT_LOAN_DETAILS,
          variables: {
            input: { loan_id },
          },
        }),
      });
  
      const pdfUrl = response.data.printLoanDetails;
  
      // Open the generated PDF in a new tab
      window.open(process.env.NEXT_PUBLIC_BASE_URL + pdfUrl, '_blank');
  
      setLoading(false);
    } catch (error) {
      console.error("Error printing loan details:", error);
      toast.error("Failed to print loan details.");
      setLoading(false);
    }
  };

  const onSubmitLoanComp = async (data: BorrLoanComputationValues, process_type: string) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];

    let variables: { input: any, process_type: string } = {
      input: {
        borrower_id: data.borrower_id,
        user_id: userData?.user?.id,
        loan_amount: data.loan_amount,
        branch_sub_id: data.branch_sub_id,
        loan_product_id: data.loan_product_id,
        ob: data.ob,
        penalty: data.penalty,
        rebates: data.rebates,
        renewal_loan_id: data.renewal_loan_id
      },
      process_type
    };
    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: PROCESS_BORROWER_LOAN_MUTATION,
        variables,
      }),
    });
    // const result = await response.json();
    // console.log(result, ' result')
    if (process_type === 'Compute') {
      setDataComputedLoans(response.data.processALoan);
    } else {
      if (response.errors) {
        toast.error(response.errors[0].message);
      } else {
        toast.success('Loan Entry Saved!');
      }
    }
  };
  const submitApproveRelease = async (data: BorrLoanRowData | undefined, selectedDate: string[], interest: string[], monthly: string[], status: number, handleRefetchLoanData: () => void) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    console.log(data, ' data');
    console.log(status, ' status');
    console.log(selectedDate, ' selectedDate');
    let variables: { input: any, selectedDate: string[], interest: string[], monthly: string[], status: number } = {
      input: {
        user_id: userData?.user?.id,
        loan_id: data?.id,
      },
      selectedDate,
      interest,
      monthly,
      status
    };
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes it is!',
    );
    if (isConfirmed) {
      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: APPROVE_LOAN_BY_SCHEDULE,
          variables,
        }),
      });
      // const result = await response.json();
      // console.log(result, ' result')
      if (response.errors) {
        toast.error(response.errors[0].message);
      } else {
        toast.success('Loan Schedule Saved!');
        handleRefetchLoanData()
      }
    }
    
  };
  
  const submitPNSigned = async (data: BorrLoanRowData | undefined, handleRefetchLoanData: () => void) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let variables: { input: any } = {
      input: {
        loan_id: data?.id,
        is_pn_signed: 1
      }
    };
    const isConfirmed = await showConfirmationModal(
      'Are you sure for PN Signed?',
      'You won\'t be able to revert this!',
      'Yes it is!',
    );
    if (isConfirmed) {
      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: LOAN_PN_SIGNING,
          variables,
        }),
      });
      // const result = await response.json();
      // console.log(result, ' result')
      if (response.errors) {
        toast.error(response.errors[0].message);
      } else {
        toast.success('PN is already been signed!');
        handleRefetchLoanData()
      }
    }
    
  };
  
  const onSubmitLoanBankDetails = async (data: LoanBankFormValues | undefined, handleRefetchLoanData: () => void) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let variables: { input: any } = {
      input: {
        loan_id: data?.loan_id,
        account_name: data?.account_name,
        surrendered_bank_id: data?.surrendered_bank_id,
        issued_bank_id: data?.issued_bank_id,
        surrendered_acct_no: data?.surrendered_acct_no,
        issued_acct_no: data?.issued_acct_no,
        surrendered_pin: data?.surrendered_pin,
        issued_pin: data?.issued_pin,
      }
    };
    const isConfirmed = await showConfirmationModal(
      'Are you sure the bank details is correct?',
      'You won\'t be able to revert this!',
      'Yes it is!',
    );
    if (isConfirmed) {
      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: SAVE_LOAN_BANK_DETAILS,
          variables,
        }),
      });
      // const result = await response.json();
      // console.log(result, ' result')
      if (response.errors) {
        toast.error(response.errors[0].message);
      } else {
        toast.success('Bank Entry Saved!');
        handleRefetchLoanData()
      }
    }
    
  };

  const onSubmitLoanRelease = async (data: LoanReleaseFormValues | undefined, handleRefetchLoanData: () => void) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let variables: { input: any } = {
      input: {
        id: data?.id,
        released_date: data?.released_date,
        bank_id: data?.bank_id,
        check_no: data?.check_no,
      }
    };
    const isConfirmed = await showConfirmationModal(
      'Are you sure you want to released?',
      'You won\'t be able to revert this!',
      'Yes it is!',
    );
    if (isConfirmed) {
      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: SAVE_LOAN_RELEASE,
          variables,
        }),
      });
      // const result = await response.json();
      // console.log(result, ' result')
      if (response.errors) {
        toast.error(response.errors[0].message);
      } else {
        toast.success('Loan Successfully Released!');
        handleRefetchLoanData()
      }
    }
    
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchLoanProducts()
  }, []);

  return {
    onSubmitLoanComp,
    loanProduct,
    dataComputedLoans,
    fetchLoans,
    loanData,
    submitApproveRelease,
    fetchSingLoans,
    loanSingleData,
    submitPNSigned,
    loading,
    onSubmitLoanBankDetails,
    onSubmitLoanRelease,
    printLoanDetails
  };
};

export default useLoans;