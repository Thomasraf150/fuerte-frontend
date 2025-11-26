"use client"

import { useState } from 'react';
import LoansQueryMutation from '@/graphql/LoansQueryMutation';
import { BorrLoanRowData, LoanBankFormValues, LoanReleaseFormValues, DataRenewalData } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { fetchWithRecache } from '@/utils/helper';
import moment from 'moment';

const useLoanDetail = () => {
  const {
    APPROVE_LOAN_BY_SCHEDULE,
    BORROWER_SINGLE_LOAN_QUERY,
    LOAN_PN_SIGNING,
    SAVE_LOAN_BANK_DETAILS,
    SAVE_LOAN_RELEASE,
    PRINT_LOAN_DETAILS,
    GET_LOAN_RENEWAL,
    DELETE_LOANS,
    UPDATE_LOAN_RELEASED
  } = LoansQueryMutation;

  const [loanSingleData, setLoanSingleData] = useState<BorrLoanRowData>();
  const [dataComputedRenewal, setDataComputedRenewal] = useState<DataRenewalData>();
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSingLoans = async (loan_id: number) => {
    console.log('[useLoanDetail] fetchSingLoans called with ID:', loan_id);
    setLoading(true);
    try {
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const token = GET_AUTH_TOKEN();

      if (!token) {
        console.error('[useLoanDetail] No auth token available');
        toast.error('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('[useLoanDetail] Fetching single loan, token available:', !!token);
      console.log('[useLoanDetail] GraphQL query:', BORROWER_SINGLE_LOAN_QUERY);
      console.log('[useLoanDetail] GraphQL variables:', { loan_id });

      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: BORROWER_SINGLE_LOAN_QUERY,
          variables: { loan_id }
        }),
      });

      console.log('[useLoanDetail] Single loan response:', {
        hasErrors: !!response.errors,
        hasData: !!response.data,
        loanData: response.data?.getLoan
      });

      if (response.errors) {
        console.error('[useLoanDetail] GraphQL errors in fetchSingLoans:', response.errors);
        throw new Error(response.errors[0]?.message || 'Failed to fetch loan');
      }

      if (!response.data?.getLoan) {
        console.error('[useLoanDetail] No loan data in response:', response);
        throw new Error('Loan not found');
      }

      console.log('[useLoanDetail] Setting loan single data:', response.data.getLoan);
      setLoanSingleData(response.data.getLoan);
    } catch (error: any) {
      console.error('[useLoanDetail] fetchSingLoans error:', {
        message: error.message,
        error,
        loan_id
      });
      toast.error('Failed to fetch loan details');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchRerewalLoan = async (renewal_id: string[]) => {
    setLoading(true);
    try {
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const token = GET_AUTH_TOKEN();

      if (!token) {
        toast.error('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: GET_LOAN_RENEWAL,
          variables: {
            input: { renewal_id },
          }
        }),
      });

      setDataComputedRenewal(response.data.getRenewalBalance);
    } catch (error) {
      toast.error('Failed to fetch renewal loan');
    } finally {
      setLoading(false);
    }
  };

  const printLoanDetails = async (loan_id: string) => {
    try {
      setLoading(true);
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const token = GET_AUTH_TOKEN();

      if (!token) {
        toast.error('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
      toast.error("Failed to print loan details.");
      setLoading(false);
    }
  };

  const submitApproveRelease = async (data: BorrLoanRowData | undefined, selectedDate: string[], interest: string[], monthly: string[], status: number, handleRefetchLoanData: () => void) => {
    setLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const token = GET_AUTH_TOKEN();

      if (!token) {
        toast.error('Authentication required. Please log in again.');
        return { success: false, error: 'No auth token' };
      }

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
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query: APPROVE_LOAN_BY_SCHEDULE,
            variables,
          }),
        });

        // Handle GraphQL errors
        if (response.errors) {
          toast.error(response.errors[0].message);
          return { success: false, error: response.errors[0].message };
        }

        toast.success('Loan Schedule Saved!');
        handleRefetchLoanData();
        return { success: true };
      }

      return { success: false, error: 'Operation cancelled by user' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const submitPNSigned = async (data: BorrLoanRowData | undefined, handleRefetchLoanData: () => void) => {
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const token = GET_AUTH_TOKEN();

      if (!token) {
        toast.error('Authentication required. Please log in again.');
        return;
      }

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
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query: LOAN_PN_SIGNING,
            variables,
          }),
        });
        if (response.errors) {
          toast.error(response.errors[0].message);
        } else {
          toast.success('PN is already been signed!');
          handleRefetchLoanData()
        }
      }
    } catch (error) {
      toast.error('Failed to submit PN signature');
    }
  };

  const onSubmitLoanBankDetails = async (data: LoanBankFormValues | undefined, handleRefetchLoanData: () => void) => {
    setLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const token = GET_AUTH_TOKEN();

      if (!token) {
        toast.error('Authentication required. Please log in again.');
        return { success: false, error: 'No auth token' };
      }

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
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query: SAVE_LOAN_BANK_DETAILS,
            variables,
          }),
        });

        // Handle GraphQL errors
        if (response.errors) {
          toast.error(response.errors[0].message);
          return { success: false, error: response.errors[0].message };
        }

        toast.success('Bank Entry Saved!');
        handleRefetchLoanData();
        return { success: true };
      }

      return { success: false, error: 'Operation cancelled by user' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const onSubmitLoanRelease = async (data: LoanReleaseFormValues | undefined, handleRefetchLoanData: () => void) => {
    setLoading(true);
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const token = GET_AUTH_TOKEN();

      if (!token) {
        toast.error('Authentication required. Please log in again.');
        return { success: false, error: 'No auth token' };
      }

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
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query: SAVE_LOAN_RELEASE,
            variables,
          }),
        });

        // Handle GraphQL errors
        if (response.errors) {
          toast.error(response.errors[0].message);
          return { success: false, error: response.errors[0].message };
        }

        toast.success('Loan Successfully Released!');
        handleRefetchLoanData();
        return { success: true };
      }

      return { success: false, error: 'Operation cancelled by user' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMaturity = async (loan_id: String, type: String, handleRefetchLoanData: () => void) => {
    try {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];
      const { GET_AUTH_TOKEN } = useAuthStore.getState();
      const token = GET_AUTH_TOKEN();

      if (!token) {
        toast.error('Authentication required. Please log in again.');
        return;
      }

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
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
    } catch (error) {
      toast.error('Failed to update loan maturity');
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

  return {
    fetchSingLoans,
    loanSingleData,
    submitApproveRelease,
    submitPNSigned,
    loading,
    onSubmitLoanBankDetails,
    onSubmitLoanRelease,
    printLoanDetails,
    fetchRerewalLoan,
    dataComputedRenewal,
    handleUpdateMaturity,
    handleChangeReleasedDate,
  };
};

export default useLoanDetail;
