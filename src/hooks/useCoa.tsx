"use client"

import { useEffect, useState } from 'react';
import { DataChartOfAccountList } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import CoaQueryMutations from '@/graphql/CoaQueryMutations';
import { fetchWithRecache } from '@/utils/helper';

const useCoa = () => {
  const { COA_TABLE_QUERY } = CoaQueryMutations;

  const [coaDataAccount, setCoaDataAccount] = useState<DataChartOfAccountList[]>();
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCoaDataTable = async () => {
    setLoading(true);

    let variables: { input: any } = {
      input : { startDate: "", endDate: "" }
    };

    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: COA_TABLE_QUERY,
        variables
      }),
    });

    // const result = await response.json();
    setCoaDataAccount(response.data.getChartOfAccounts);
    setLoading(false);
  };
  
  return {
    fetchCoaDataTable,
    coaDataAccount
  };
};

export default useCoa;