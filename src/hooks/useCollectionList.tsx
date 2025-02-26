"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { DataColListRow } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import CollectionListQueryMutations from '@/graphql/CollectionListQueryMutations';
import { fetchWithRecache } from '@/utils/helper';

const useCollectionList = () => {
  const { GET_DATA_COLLECTION_LIST } = CollectionListQueryMutations;

  // const [loanSingleData, setLoanSingleData] = useState<BorrLoanRowData>();
  const [dataColListData, setDataColListData] = useState<DataColListRow[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const rowsPerPage = 10;
  // Function to fetchdata
  
  const fetchCollectionList = async (first: number, page: number, loan_id: number) => {
    setLoading(true);
    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_DATA_COLLECTION_LIST,
        variables: { first, page, orderBy: [
          { column: "loan_id", order: 'DESC' }
        ], loan_id}
      }),
    });

    // const result = await response.json();
    // setDataColListData(response.data.getLoans.data);
    setDataColListData(response.data.getCollectionLists.data);
    setLoading(false);
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
  }, []);

  return {
    fetchCollectionList,
    dataColListData,
    loading
  };
};

export default useCollectionList;