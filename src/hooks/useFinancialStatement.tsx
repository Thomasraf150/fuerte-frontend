"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { DataLoanProceedList, DataAccBalanceSheet, DataAccIncomeStatement } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import FinancialStatementQueryMutations from '@/graphql/FinancialStatementQueryMutations';
import { fetchWithRecache } from '@/utils/helper';
import moment from 'moment';

const useFinancialStatement = () => {
  const { GET_BALANCE_SHEET, GET_INCOME_STATEMENT, PRINT_INCOME_STATEMENT } = FinancialStatementQueryMutations;

  const [balanceSheetData, setBalanceSheetData] = useState<DataAccBalanceSheet>();
  const [isInterestIncomeData, setIsInterestIncomeData] = useState<any>();
  const [isOtherRevenueData, setIsOtherRevenueData] = useState<any>();
  const [directFinancingData, setDirectFinancingData] = useState<any>();
  const [otherIncomeExpenseData, setOtherIncomeExpenseData] = useState<any>();
  const [lessExpenseData, setLessExpenseData] = useState<any>();
  const [incomeTaxData, setIncomeTaxData] = useState<any>();
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [printLoading, setPrintLoading] = useState<boolean>(false);
 
  const fetchBalanceSheetData = async (startDate: Date | undefined, endDate: Date | undefined, branch_sub_id: string) => {
    setLoading(true);

    let variables: { startDate: string, endDate: string, branch_sub_id: string } = {
      startDate : moment(startDate).format('YYYY-MM-DD'),
      endDate : moment(endDate).format('YYYY-MM-DD'),
      branch_sub_id
    };

    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_BALANCE_SHEET,
        variables
      }),
    });
    setBalanceSheetData(response.data.getBalanceSheet);
    setLoading(false);
  };
  
  const fetchStatementData = async (startDate: Date | undefined, endDate: Date | undefined, branch_sub_id: string) => {
    setLoading(true);

    let variables: { startDate: string, endDate: string, branch_sub_id: string } = {
      startDate : moment(startDate).format('YYYY-MM-DD'),
      endDate: moment(endDate).format('YYYY-MM-DD'),
      branch_sub_id
    };

    const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_INCOME_STATEMENT,
        variables
      }),
    });
    const pivotData = response.data.getIncomeStatement;
    setIsInterestIncomeData(pivotData[0]);
    setIsOtherRevenueData(pivotData[1]);
    setDirectFinancingData(pivotData[2]);
    setOtherIncomeExpenseData(pivotData[3]);
    setLessExpenseData(pivotData[4]);
    setIncomeTaxData(pivotData[5]);
    setLoading(false);
  };

  const printIncomeStatement = async (startDate: Date | undefined, endDate: Date | undefined, branch_sub_id: string) => {
    // STEP 1: Open blank window IMMEDIATELY (synchronous, during user click)
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
            <h2>Generating Income Statement PDF...</h2>
            <p>Please wait while we prepare your document.</p>
          </div>
        </body>
      </html>
    `);
    newWindow.document.close();

    setPrintLoading(true);

    try {
      console.log('🖨️ Starting PDF generation', {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
        branch_sub_id,
      });

      const variables: { startDate: string, endDate: string, branch_sub_id: string } = {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
        branch_sub_id
      };

      // STEP 3: Execute async GraphQL mutation
      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: PRINT_INCOME_STATEMENT,
          variables
        }),
      });

      console.log('📄 PDF generation response:', response);

      // Check for GraphQL errors
      if (response.errors && response.errors.length > 0) {
        const errorMessage = response.errors[0].message;
        console.error('❌ GraphQL errors:', response.errors);
        newWindow.close();
        toast.error(errorMessage || 'Failed to generate PDF');
        return null;
      }

      // Validate response data
      const pdfResult = response.data?.printIncomeStatement;

      if (!pdfResult) {
        console.error('❌ No PDF result in response');
        newWindow.close();
        toast.error('PDF generation failed: No result returned');
        return null;
      }

      const { url, filename, size } = pdfResult;

      // Validate URL
      if (!url || typeof url !== 'string') {
        console.error('❌ Invalid PDF URL:', url);
        newWindow.close();
        toast.error('PDF generation failed: Invalid URL');
        return null;
      }

      // Validate URL format
      try {
        const urlObj = new URL(url);
        console.log('✅ Valid URL:', urlObj.href);
      } catch (e) {
        console.error('❌ Malformed URL:', url, e);
        newWindow.close();
        toast.error('PDF generation failed: Malformed URL');
        return null;
      }

      // Validate file size
      if (!size || size <= 0) {
        console.warn('⚠️ PDF file size is zero or invalid:', size);
        newWindow.close();
        toast.error('PDF generation failed: Empty file');
        return null;
      }

      console.log('📦 PDF details:', {
        url,
        filename,
        sizeKB: (size / 1024).toFixed(2),
      });

      // STEP 4: Update the already-open window with PDF URL
      // No popup blocker because window is already open!
      newWindow.location.href = url;

      console.log('✅ PDF loaded in new tab');
      toast.success('Income Statement PDF generated successfully!', {
        autoClose: 3000,
      });

      return url;

    } catch (error) {
      console.error('❌ Unexpected error during PDF generation:', error);

      // Close the window on error
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

  useEffect(() => {
    // fetchBalanceSheetData();
    // fetchStatementData();
  }, []);

  return {
    fetchBalanceSheetData,
    fetchStatementData,
    printIncomeStatement,
    balanceSheetData,
    isInterestIncomeData,
    isOtherRevenueData,
    directFinancingData,
    otherIncomeExpenseData,
    lessExpenseData,
    incomeTaxData,
    loading,
    printLoading,
  };
};

export default useFinancialStatement;