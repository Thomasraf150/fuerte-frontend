"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import NotesReceivableQueryMutation from '@/graphql/NotesReceivableQueryMutation';
// import { SummaryTicketValues } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';

interface NrProps {
  data: { 
    loan_ref: string;
    firstname: string;
    middlename: string;
    lastname: string;
    released_date: string;
    from: string;
    to: string;
    pn_amount: string;
    terms: string;
    trans_per_month: { 
      month: string;
      current_target: string;
      actual_collection: string;
      ua_sp: string;
      past_due_target_ua_sp: string;
      actual_col_ua_sp: string;
      past_due_balance_ua_sp: string;
      advanced_payment: string;
      ob_closed: string;
      early_full_payments: string;
      adjustments: string;
    }[];
  }[] | undefined;
  months: string[] | undefined;
}

const useNotesReceivable = () => {

  const { NR_SCHEDULE_LIST } = NotesReceivableQueryMutation;
  
  const [dataNotesReceivable, setDataNotesReceivable] = useState<NrProps>();
  const [nrLoading, setNrLoading] = useState<boolean>(false);
  // Function to fetchdata

  const fetchNotesReceivableList = async (startDate: Date | undefined, endDate: Date | undefined) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD')
      },
    };

    mutation = NR_SCHEDULE_LIST;
    setNrLoading(true);

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
    setDataNotesReceivable(result.data.getNrSchedule);
    setNrLoading(false);
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
  }, []);

  return {
    fetchNotesReceivableList,
    dataNotesReceivable,
    nrLoading
  };
};

export default useNotesReceivable;