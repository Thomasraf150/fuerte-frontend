"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { DataColListRow, DataRowLoanPayments } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";
import CollectionListQueryMutations from '@/graphql/CollectionListQueryMutations';
import { fetchWithRecache } from '@/utils/helper';

const useCollectionList = () => {
  const { GET_DATA_COLLECTION_LIST, GET_COLLECTION_ENTRY } = CollectionListQueryMutations;

  // const [loanSingleData, setLoanSingleData] = useState<BorrLoanRowData>();
  const [dataColListData, setDataColListData] = useState<DataColListRow[]>();
  const [dataColEntry, setDataColEntry] = useState<DataRowLoanPayments[]>();
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

  const fetchCollectionEntry = async (loan_schedule_id: String, trans_date: String) => {

    let variables: { input: any } = {
      input : { loan_schedule_id, trans_date }
    };

    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_COLLECTION_ENTRY,
        variables
      }),
    });

    // const result = await response.json();
    // setDataColListData(response.data.getLoans.data);
    setDataColEntry(response.data.getCollectionEntry);
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
  }, []);

  return {
    fetchCollectionList,
    fetchCollectionEntry,
    dataColListData,
    dataColEntry,
    loading
  };
};

export default useCollectionList;