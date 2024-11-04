"use client"

import { useEffect, useState } from 'react';
import { CustomerLedgerData } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import SoaQueryMutation from '@/graphql/SoaQueryMutation';
import { fetchWithRecache } from '@/utils/helper';

const useSoa = () => {
  const { GET_CUSTOMER_LEDGER } = SoaQueryMutation;

  const [custLedgerData, setCustLedgerData] = useState<CustomerLedgerData[]>();
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCustomerLedger = async (loan_id: string) => {
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
        query: GET_CUSTOMER_LEDGER,
        variables
      }),
    });

    // const result = await response.json();
    setCustLedgerData(response.data.getCustomerLedger);
    setLoading(false);
  };
  
  return {
    fetchCustomerLedger,
    custLedgerData,
    loading
  };
};

export default useSoa;