"use client"

import { useEffect, useState, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import LoanProductsQueryMutations from '@/graphql/LoanProductsQueryMutations';
import { DataRowLoanProducts, BorrLoanComputationValues, BorrLoanRowData, LoanBankFormValues, LoanReleaseFormValues, DataRenewalData } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import LoansQueryMutation from '@/graphql/LoansQueryMutation';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { fetchWithRecache } from '@/utils/helper';
import moment from 'moment';
import { usePagination } from '@/hooks/usePagination';

const useLoans = () => {
  const { GET_LOAN_PRODUCT_QUERY, SAVE_LOAN_PRODUCT_QUERY, UPDATE_LOAN_PRODUCT_QUERY } = LoanProductsQueryMutations;
  const { BORROWER_LOAN_QUERY, 
          PROCESS_BORROWER_LOAN_MUTATION, 
          APPROVE_LOAN_BY_SCHEDULE, 
          BORROWER_SINGLE_LOAN_QUERY, 
          LOAN_PN_SIGNING, 
          SAVE_LOAN_BANK_DETAILS,
          SAVE_LOAN_RELEASE,
          PRINT_LOAN_DETAILS,
          GET_LOAN_RENEWAL, 
          DELETE_LOANS,
          UPDATE_LOAN_RELEASED } = LoansQueryMutation;

  // const [dataUser, setDataUser] = useState<User[] | undefined>(undefined);
  const [loanProduct, setLoanProduct] = useState<DataRowLoanProducts[]>([]);
  const [loanData, setLoanData] = useState<BorrLoanRowData[]>([]);
  const [loanSingleData, setLoanSingleData] = useState<BorrLoanRowData>();
  const [dataComputedLoans, setDataComputedLoans] = useState<[]>([]);
  const [dataComputedRenewal, setDataComputedRenewal] = useState<DataRenewalData>();
  const [loading, setLoading] = useState<boolean>(false);
  const rowsPerPage = 10;

  // Pagination wrapper function for server-side pagination
  const fetchLoansForPagination = useCallback(async (first: number, page: number, search?: string) => {
    const { GET_AUTH_TOKEN } = useAuthStore.getState();
    try {
      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GET_AUTH_TOKEN()}`
        },
        body: JSON.stringify({
          query: BORROWER_LOAN_QUERY,
          variables: {
            first,
            page,
            orderBy: [{ column: "id", order: 'DESC' }],
            borrower_id: 0, // Use 0 to fetch all loans
            ...(search && { search })
          },
        }),
      });

      console.log('GraphQL Response:', response); // Debug log
      console.log('Loans Data:', response.data?.getLoans?.data);
      console.log('Paginator Info:', response.data?.getLoans?.paginatorInfo);

      // Check if response has errors
      if (response.errors) {
        console.error('GraphQL Errors:', response.errors);
        throw new Error(response.errors[0]?.message || 'GraphQL query failed');
      }

      // Ensure response.data exists
      if (!response.data || !response.data.getLoans) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response structure from API');
      }

      const loansData = response.data.getLoans.data || [];
      const paginatorInfo = response.data.getLoans.paginatorInfo;

      return {
        data: loansData,
        paginatorInfo: paginatorInfo || {
          total: loansData.length,
          currentPage: page,
          lastPage: 1,
          hasMorePages: false
        }
      };
    } catch (error) {
      console.error('fetchLoansForPagination error:', error);
      throw error;
    }
  }, [BORROWER_LOAN_QUERY]);

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
 
  const fetchRerewalLoan = async (renewal_id: string[]) => {
    setLoading(true);
    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LOAN_RENEWAL,
        variables: {
          input: { renewal_id },
        }
      }),
    });

    // const result = await response.json();
    setDataComputedRenewal(response.data.getRenewalBalance);
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

    // Development debugging
    console.log('useLoans - onSubmitLoanComp called:', { data, process_type });

    setLoading(true);
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
        ...(data.renewal_loan_id !== '' ? { renewal_loan_id: data.renewal_loan_id } : {}),
        renewal_details: data.renewal_details
      },
      process_type
    };

    console.log('useLoans - API variables:', variables);

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
    console.log('useLoans - API response:', response);

    if (process_type === 'Compute') {
      if (response.data && response.data.processALoan) {
        setDataComputedLoans(response.data.processALoan);
        console.log('useLoans - Computation successful:', response.data.processALoan);
      } else {
        console.error('useLoans - No processALoan data in response:', response);
        toast.error('Failed to compute loan. Please check all fields.');
      }
      setLoading(false);
    } else {
      if (response.errors) {
        console.error('useLoans - API errors:', response.errors);
        toast.error(response.errors[0].message);
      } else {
        console.log('useLoans - Save successful');
        toast.success('Loan Entry Saved!');
      }
      setLoading(false);
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
  
  const handleDeleteLoans = async (loan_id: String, type: String) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let variables: { input: any } = {
      input: {
        loan_id,
        type
      }
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
          query: DELETE_LOANS,
          variables,
        }),
      });
      if (response.errors) {
        toast.error(response.errors[0].message);
      } else {
        toast.success(response?.data?.removeLoans?.message);
        refresh();
      }
    }
  };
  
  const handleUpdateMaturity = async (loan_id: String, type: String, handleRefetchLoanData: () => void) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let variables: { input: any } = {
      input: {
        loan_id,
        type
      }
    };
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'This loan is already released, once you confirm it will go back to for approval status',
      'Confirm',
    );
    if (isConfirmed) {
      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: DELETE_LOANS,
          variables,
        }),
      });
      if (response.errors) {
        toast.error(response.errors[0].message);
      } else {
        if (response?.data?.removeLoans?.status === false) {
          toast.error(response?.data?.removeLoans?.message);
        } else {
          toast.success(response?.data?.removeLoans?.message);
        }
        handleRefetchLoanData();
      }
    }
  };
  const handleChangeReleasedDate = async (loan_id: String, released_date: String, handleRefetchLoanData: () => void) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    const { GET_AUTH_TOKEN } = useAuthStore.getState();

    let variables: { input: any } = {
      input: {
        loan_id,
        released_date: moment(String(released_date)).format('YYYY-MM-DD')
      }
    };
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You are about to update the released date',
      'Confirm',
    );
    if (isConfirmed) {
      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GET_AUTH_TOKEN()}`
        },
        body: JSON.stringify({
          query: UPDATE_LOAN_RELEASED,
          variables,
        }),
      });
      if (response.errors) {
        toast.error(response.errors[0].message);
      } else {
        if (response?.data?.updateLoanReleasedDate?.status === false) {
          toast.error(response?.data?.updateLoanReleasedDate?.message);
        } else {
          toast.success(response?.data?.updateLoanReleasedDate?.message);
        }
        handleRefetchLoanData();
      }
    }
  };

  // Pagination hook integration for server-side pagination
  const {
    data: dataLoans,
    loading: loansLoading,
    pagination,
    searchQuery,
    goToPage,
    changePageSize,
    setSearchQuery,
    refresh,
  } = usePagination<BorrLoanRowData>({
    fetchFunction: fetchLoansForPagination,
    config: { initialPageSize: 20 }
  });

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
    printLoanDetails,
    fetchRerewalLoan,
    dataComputedRenewal,
    handleDeleteLoans,
    handleUpdateMaturity,
    handleChangeReleasedDate,
    // Server-side pagination props
    dataLoans,
    loansLoading,
    serverSidePaginationProps: {
      totalRecords: pagination.totalRecords,
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.hasNextPage,
      hasPreviousPage: pagination.hasPreviousPage,
      onPageChange: goToPage,
      onPageSizeChange: changePageSize,
      searchQuery,
      onSearchChange: setSearchQuery,
      pageSizeOptions: [10, 20, 50, 100],
      enableSearch: true, // Enable search as backend now supports it
    },
    refreshLoans: refresh,
  };
};

export default useLoans;