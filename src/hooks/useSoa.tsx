"use client"

import { useState } from 'react';
import { CustomerLedgerData } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import SoaQueryMutation from '@/graphql/SoaQueryMutation';
import { fetchWithRecache } from '@/utils/helper';
import { useDownloadPdf } from '@/hooks/useDownloadPdf';

const useSoa = () => {
  const { GET_CUSTOMER_LEDGER, PRINT_STATE_OF_ACCOUNT } = SoaQueryMutation;

  const [custLedgerData, setCustLedgerData] = useState<CustomerLedgerData[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const { download, printing } = useDownloadPdf();

  const fetchCustomerLedger = async (loan_id: string) => {
    setLoading(true);

    let variables: { input: any } = {
      input: { loan_id: loan_id }
    };

    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_CUSTOMER_LEDGER,
        variables
      }),
    });

    setCustLedgerData(response.data.getCustomerLedger);
    setLoading(false);
  };

  const printStateOfAccount = async (loan_id: string) => {
    if (!loan_id) {
      toast.error('No loan selected.');
      return;
    }
    await download({
      query: PRINT_STATE_OF_ACCOUNT,
      variables: { input: { loan_id } },
      extractUrl: (data) => data?.printStateOfAccount,
      loadingTitle: 'Generating Statement of Account…',
      successMessage: 'Statement of Account ready.',
      errorMessage: 'Failed to generate Statement of Account.',
    });
  };

  return {
    fetchCustomerLedger,
    custLedgerData,
    loading,
    printStateOfAccount,
    printing,
  };
};

export default useSoa;
