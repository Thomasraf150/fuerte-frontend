"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import SummaryTicketReports from '@/graphql/SummaryTicketReportsQueryMutation';
// import { SummaryTicketValues } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';
import { fetchWithRecache } from '@/utils/helper';

const useSummaryTicket = () => {

  const { GET_SUMMARY_TICKET_REPORTS, GET_SUMMARY_TICKET_WITH_BREAKDOWN, PRINT_SUMMARY_TIX } = SummaryTicketReports;

  const [dataSummaryTicket, setDataSummaryTicket] = useState<any>();
  const [sumTixLoading, setSumTixLoading] = useState<boolean>(false);
  const [printLoading, setPrintLoading] = useState<boolean>(false);
  // Function to fetchdata

  const fetchSummaryTixReport = async (startDate: Date | undefined, endDate: Date | undefined, branch_sub_id: string, show_breakdown: boolean = false) => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
        branch_sub_id,
        show_breakdown
      },
    };

    // Use breakdown query when show_breakdown is true
    mutation = show_breakdown ? GET_SUMMARY_TICKET_WITH_BREAKDOWN : GET_SUMMARY_TICKET_REPORTS;
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
    const data = show_breakdown ? result.data.getSummaryTicketWithBreakdown : result.data.getSummaryTicket;
    setDataSummaryTicket(data);
    setSumTixLoading(false);
  };

  const printSummaryTicketDetails = async (
    startDate: Date | undefined,
    endDate: Date | undefined,
    branch_sub_id: string,
    show_breakdown: boolean = false
  ) => {
    // STEP 1: Open blank window IMMEDIATELY (prevents popup blocker)
    const newWindow = window.open('', '_blank');

    if (!newWindow) {
      toast.error('Please allow popups for this site to view PDFs');
      return null;
    }

    // STEP 2: Show loading message in the new window
    newWindow.document.write(`
      <html>
        <head>
          <title>Generating PDF...</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .loader { text-align: center; }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="loader">
            <div class="spinner"></div>
            <h2>Generating Summary Ticket PDF...</h2>
            <p>Please wait while we prepare your document.</p>
          </div>
        </body>
      </html>
    `);
    newWindow.document.close();

    setPrintLoading(true);

    try {
      const variables = {
        input: {
          startDate: moment(startDate).format('YYYY-MM-DD'),
          endDate: moment(endDate).format('YYYY-MM-DD'),
          branch_sub_id,
          show_breakdown
        }
      };

      console.log('🚀 [PDF Generation] Starting with variables:', variables);

      // STEP 3: Execute async GraphQL mutation
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: PRINT_SUMMARY_TIX,
          variables
        }),
      });

      console.log('📡 [PDF Generation] Response status:', response.status, response.statusText);

      const result = await response.json();
      console.log('📦 [PDF Generation] GraphQL result:', result);

      // Check for GraphQL errors
      if (result.errors && result.errors.length > 0) {
        console.error('❌ [PDF Generation] GraphQL errors:', result.errors);
        newWindow.close();
        toast.error(result.errors[0].message || 'Failed to generate PDF');
        return null;
      }

      // Validate response data
      const pdfUrl = result.data?.printSummaryDetails;
      console.log('🔗 [PDF Generation] PDF URL from response:', pdfUrl);

      if (!pdfUrl || typeof pdfUrl !== 'string') {
        console.error('❌ [PDF Generation] Invalid PDF URL:', pdfUrl);
        newWindow.close();
        toast.error('PDF generation failed: Invalid URL');
        return null;
      }

      // STEP 4: Update the already-open window with PDF URL
      const fullUrl = process.env.NEXT_PUBLIC_BASE_URL + pdfUrl;
      console.log('✅ [PDF Generation] Opening PDF at:', fullUrl);
      newWindow.location.href = fullUrl;

      toast.success('Summary Ticket PDF generated successfully!', {
        autoClose: 3000,
      });

      return fullUrl;

    } catch (error) {
      console.error('💥 [PDF Generation] Unexpected error:', error);
      console.error('💥 [PDF Generation] Error type:', typeof error);
      console.error('💥 [PDF Generation] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

      if (newWindow && !newWindow.closed) {
        newWindow.close();
      }

      if (error instanceof Error) {
        console.error('💥 [PDF Generation] Error message:', error.message);
        console.error('💥 [PDF Generation] Error stack:', error.stack);
        toast.error(`Failed to generate PDF: ${error.message}`);
      } else {
        toast.error('An unexpected error occurred while generating the PDF');
      }
      return null;
    } finally {
      setPrintLoading(false);
    }
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
  }, []);

  return {
    fetchSummaryTixReport,
    printSummaryTicketDetails,
    dataSummaryTicket,
    sumTixLoading,
    printLoading
  };
};

export default useSummaryTicket;