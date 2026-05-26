"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import GeneralLedgerQueryMutations from '@/graphql/GeneralLedgerQueryMutations';
import { RowAcctgEntry, DataGLRow } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';
import { graphqlFetch } from '@/utils/graphqlFetch';

const useGeneralLedger = () => {

  const { GET_GL_QUERY } = GeneralLedgerQueryMutations;

  const [loading, setLoading] = useState<boolean>(false);
  const [dataGl, setDataGl] = useState<DataGLRow[]>();
  // Function to fetchdata

  const fetchGL = async (startDate: string, endDate: string) => {
    // const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    // const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        startDate,
        endDate,
      },
    };

    mutation = GET_GL_QUERY;
    setLoading(true);

    const result = await graphqlFetch(mutation, variables);
    setDataGl(result?.data.getGL);
    setLoading(false);
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
  }, []);

  return {
    fetchGL,
    dataGl,
    loading
  };
};

export default useGeneralLedger;