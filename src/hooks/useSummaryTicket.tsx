"use client"

import { useState } from 'react';
import SummaryTicketReports from '@/graphql/SummaryTicketReportsQueryMutation';
import { toast } from "react-toastify";
import moment from 'moment';

const useSummaryTicket = () => {

  const { GET_SUMMARY_TICKET_REPORTS, GET_SUMMARY_TICKET_WITH_BREAKDOWN, PRINT_SUMMARY_TIX } = SummaryTicketReports;

  const [dataSummaryTicket, setDataSummaryTicket] = useState<any>();
  const [sumTixLoading, setSumTixLoading] = useState<boolean>(false);
  const [printLoading, setPrintLoading] = useState<boolean>(false);
  // Function to fetchdata

  const fetchSummaryTixReport = async (startDate: Date | undefined, endDate: Date | undefined, branch_sub_id: string, show_breakdown: boolean = false, branch_id: string = '') => {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const userData = JSON.parse(storedAuthStore)['state'];
    let mutation;
    let variables: { input: any } = {
      input: {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
        branch_sub_id,
        branch_id,
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
    show_breakdown: boolean = false,
    branch_id: string = ''
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
          branch_id,
          show_breakdown
        }
      };

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

      const result = await response.json();

      // Check for GraphQL errors
      if (result.errors && result.errors.length > 0) {
        console.error('[PDF] GraphQL errors:', result.errors);
        newWindow.close();
        toast.error(result.errors[0].message || 'Failed to generate PDF');
        return null;
      }

      // Validate response data
      const pdfUrl = result.data?.printSummaryDetails;

      if (!pdfUrl || typeof pdfUrl !== 'string') {
        console.error('[PDF] Invalid URL:', pdfUrl);
        newWindow.close();
        toast.error('PDF generation failed: Invalid URL');
        return null;
      }

      // STEP 4: Update the already-open window with PDF URL
      const fullUrl = process.env.NEXT_PUBLIC_BASE_URL + pdfUrl;
      newWindow.location.href = fullUrl;

      toast.success('Summary Ticket PDF generated successfully!', {
        autoClose: 3000,
      });

      return fullUrl;

    } catch (error) {
      console.error('[PDF] Generation failed:', error);

      if (newWindow && !newWindow.closed) {
        newWindow.close();
      }

      if (error instanceof Error) {
        toast.error(`Failed to generate PDF: ${error.message}`);
      } else {
        toast.error('An unexpected error occurred while generating the PDF');
      }
      return null;
    } finally {
      setPrintLoading(false);
    }
  };

  return {
    fetchSummaryTixReport,
    printSummaryTicketDetails,
    dataSummaryTicket,
    sumTixLoading,
    printLoading
  };
};

export default useSummaryTicket;