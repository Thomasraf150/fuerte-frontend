"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import SummaryTicketReports from '@/graphql/SummaryTicketReportsQueryMutation';
// import { SummaryTicketValues } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';
import { fetchWithRecache } from '@/utils/helper';

const useSummaryTicket = () => {

  const { GET_SUMMARY_TICKET_REPORTS, PRINT_SUMMARY_TIX } = SummaryTicketReports;
  
  const [dataSummaryTicket, setDataSummaryTicket] = useState<[]>();
  const [sumTixLoading, setSumTixLoading] = useState<boolean>(false);
  // Function to fetchdata

  const fetchSummaryTixReport = async (startDate: Date | undefined, endDate: Date | undefined, branch_sub_id: string) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
        branch_sub_id
      },
    };

    mutation = GET_SUMMARY_TICKET_REPORTS;
    setSumTixLoading(true);

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
    setDataSummaryTicket(result.data.getSummaryTicket);
    setSumTixLoading(false);
  };

  const printSummaryTicketDetails = async (startDate?: string, endDate?: string, branch_sub_id?: string) => {
      try {
        setSumTixLoading(true);
        const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: PRINT_SUMMARY_TIX,
            variables: {
              input: { 
                startDate,
                endDate,
                branch_sub_id
              },
            },
          }),
        });
    
        const pdfUrl = response.data.printSummaryDetails;
    
        // Open the generated PDF in a new tab
        window.open(process.env.NEXT_PUBLIC_BASE_URL + pdfUrl, '_blank');
    
        setSumTixLoading(false);
      } catch (error) {
        console.error("Error printing loan details:", error);
        toast.error("Failed to print loan details.");
        setSumTixLoading(false);
      }
    };

   // Fetch data on component mount if id exists
  useEffect(() => {
  }, []);

  return {
    fetchSummaryTixReport,
    printSummaryTicketDetails,
    dataSummaryTicket,
    sumTixLoading
  };
};

export default useSummaryTicket;