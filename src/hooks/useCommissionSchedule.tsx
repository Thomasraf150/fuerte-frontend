"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import CommissionScheduleQueryMutations from '@/graphql/CommissionScheduleQueryMutations';
// import { SummaryTicketValues } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';

interface CSProps {
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
      commission_collected: string;
    }[];
  }[] | undefined;
  months: string[] | undefined;
}

const useCommissionSchedule = () => {

  const { CS_SCHEDULE_LIST } = CommissionScheduleQueryMutations;
  
  const [dataCommissionSched, setDataCommissionSched] = useState<CSProps>();
  const [nrLoading, setNrLoading] = useState<boolean>(false);
  // Function to fetchdata

  const fetchCommissionSchedule = async (startDate: Date | undefined, endDate: Date | undefined) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD')
      },
    };

    mutation = CS_SCHEDULE_LIST;
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
    setDataCommissionSched(result.data.getCommissionSchedule);
    setNrLoading(false);
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
  }, []);

  return {
    fetchCommissionSchedule,
    dataCommissionSched,
    nrLoading
  };
};

export default useCommissionSchedule;