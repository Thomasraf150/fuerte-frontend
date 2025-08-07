"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import GeneralVoucherQueryMutations from '@/graphql/GeneralVoucherQueryMutations';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';
import { fetchWithRecache } from '@/utils/helper';

const useGeneralVoucher = () => {

  const { CREATE_GV_MUTATION, UPDATE_GV_MUTATION, GET_GV_QUERY, PRINT_CV_MUTATION } = GeneralVoucherQueryMutations;

  const [loading, setLoading] = useState<boolean>(false);
  const [dataGV, setDataGV] = useState<RowAcctgEntry[]>();
  // Function to fetchdata

  const fetchGV = async (branch_sub_id: string, startDate: string, endDate: string) => {
    // const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    // const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        branch_sub_id,
        startDate,
        endDate
      },
    };

    mutation = GET_GV_QUERY;
    setLoading(true);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });
    const result = await response.json();
    setDataGV(result?.data.getCheckVoucher);
    setLoading(false);
  };

  const createGV = async (row: RowAcctgEntry) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        id: row?.id,
        user_id: String(userData?.user?.id),
        journal_date: row?.journal_date,
        vendor_id: row?.vendor_id,
        journal_name: row?.journal_name,
        check_no: row?.check_no,
        journal_desc: row?.journal_desc,
        acctg_details: row?.acctg_details
      },
    };

    mutation = CREATE_GV_MUTATION;
    setLoading(true);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });
    const result = await response.json();
    toast.success(result?.data.createGvEntry?.message);
    setLoading(false);
  };
  
  const updateGV = async (row: RowAcctgEntry, journal_date: string) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        id: row?.id,
        journal_date,
      },
    };

    mutation = UPDATE_GV_MUTATION;
    setLoading(true);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });
    const result = await response.json();
    toast.success(result?.data.updateGvEntry?.message);
    setLoading(false);
  };

  const printSummaryTicketDetails = async (journal_ref: string) => {
    try {
      // setSumTixLoading(true);
      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: PRINT_CV_MUTATION,
          variables: {
            input: { 
              journal_ref
            },
          },
        }),
      });
  
      const pdfUrl = response.data.printAcctgEntries;
  
      // Open the generated PDF in a new tab
      window.open(process.env.NEXT_PUBLIC_BASE_URL + pdfUrl, '_blank');
  
      // setSumTixLoading(false);
    } catch (error) {
      console.error("Error printing loan details:", error);
      toast.error("Failed to print loan details.");
      // setSumTixLoading(false);
    }
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchGV("","","");
  }, []);

  return {
    createGV,
    updateGV,
    fetchGV,
    dataGV,
    printSummaryTicketDetails,
    loading
  };
};

export default useGeneralVoucher;