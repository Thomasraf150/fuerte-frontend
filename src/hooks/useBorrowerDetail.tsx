"use client"

import BorrowerQueryMutations from '@/graphql/BorrowerQueryMutations';
import { BorrowerInfo } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import useBorrowerBase from './useBorrowerBase';

/**
 * Hook for borrower detail page operations
 * Extends useBorrowerBase with single borrower fetching
 */
const useBorrowerDetail = () => {
  const { GET_SINGLE_BORROWER_QUERY } = BorrowerQueryMutations;

  const {
    borrowerLoading,
    setBorrowerLoading,
    dataChief,
    dataArea,
    dataSubArea,
    dataBorrCompany,
    submitBorrower,
    fetchDataChief,
    fetchDataArea,
    fetchDataSubArea,
    fetchDataBorrCompany,
  } = useBorrowerBase();

  /**
   * Submit borrower with optional refresh callback
   */
  const onSubmitBorrower = async (
    data: BorrowerInfo,
    refreshCallback?: () => void
  ): Promise<{ success: boolean; error?: string; data?: any }> => {
    return submitBorrower(data, refreshCallback);
  };

  /**
   * Fetch a single borrower by ID
   */
  const fetchSingleBorrower = async (borrowerId: number) => {
    setBorrowerLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GET_SINGLE_BORROWER_QUERY,
          variables: { id: borrowerId.toString() }
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Failed to fetch borrower');
      }

      const borrower = result.data?.getBorrower;

      if (!borrower) {
        throw new Error('Borrower not found');
      }

      setBorrowerLoading(false);
      return borrower;
    } catch (error) {
      console.error('Error fetching single borrower:', error);
      toast.error('Failed to load borrower details');
      setBorrowerLoading(false);
      throw error;
    }
  };

  return {
    dataChief,
    dataArea,
    dataSubArea,
    fetchDataSubArea,
    dataBorrCompany,
    onSubmitBorrower,
    borrowerLoading,
    fetchDataChief,
    fetchDataArea,
    fetchDataBorrCompany,
    fetchSingleBorrower,
  };
};

export default useBorrowerDetail;
