"use client"

import { useState } from 'react';
import { DataAccBalanceSheet } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import FinancialStatementQueryMutations from '@/graphql/FinancialStatementQueryMutations';
import { fetchWithRecache } from '@/utils/helper';
import moment from 'moment';

/**
 * PDF Loading Window HTML template
 */
const PDF_LOADING_HTML = `
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
`;

interface PdfResult {
  url: string;
  filename: string;
  size: number;
}

/**
 * Validates PDF result from GraphQL response
 * Returns error message if invalid, null if valid
 */
function validatePdfResult(pdfResult: PdfResult | null | undefined): string | null {
  if (!pdfResult) {
    return 'PDF generation failed: No result returned';
  }

  const { url, size } = pdfResult;

  if (!url || typeof url !== 'string') {
    return 'PDF generation failed: Invalid URL';
  }

  try {
    new URL(url);
  } catch {
    return 'PDF generation failed: Malformed URL';
  }

  if (!size || size <= 0) {
    return 'PDF generation failed: Empty file';
  }

  return null;
}

/**
 * Income Statement Row Data
 * Represents a single row in the income statement pivot table
 * Contains account info plus dynamic month columns (e.g., "2025-01": "1234.56")
 */
export interface IncomeStatementRow {
  row_count?: number;
  AccountName: string;
  acctnumber: string | null;
  variance: string | number | null;
  // Dynamic month columns - keys like "2025-01", "2025-02", etc.
  [monthKey: string]: string | number | null | undefined;
}

/**
 * Income Statement Row with Branch Info
 * Used for breakdown by sub-branch view
 */
export interface IncomeStatementByBranchRow extends IncomeStatementRow {
  branch_sub_id: number;
  branch_name: string;
  branch_code: string | null;
}

/**
 * Consolidated breakdown data structure
 * Groups all 6 breakdown datasets into a single state object
 */
export interface BreakdownData {
  interestIncome?: IncomeStatementByBranchRow[];
  otherRevenues?: IncomeStatementByBranchRow[];
  directFinancing?: IncomeStatementByBranchRow[];
  lessExpense?: IncomeStatementByBranchRow[];
  otherIncomeExpense?: IncomeStatementByBranchRow[];
  incomeTax?: IncomeStatementByBranchRow[];
}

const useFinancialStatement = () => {
  const {
    GET_BALANCE_SHEET,
    GET_INCOME_STATEMENT,
    GET_INCOME_STATEMENT_WITH_BREAKDOWN,
    PRINT_INCOME_STATEMENT
  } = FinancialStatementQueryMutations;

  const [balanceSheetData, setBalanceSheetData] = useState<DataAccBalanceSheet>();
  const [isInterestIncomeData, setIsInterestIncomeData] = useState<IncomeStatementRow[] | undefined>();
  const [isOtherRevenueData, setIsOtherRevenueData] = useState<IncomeStatementRow[] | undefined>();
  const [directFinancingData, setDirectFinancingData] = useState<IncomeStatementRow[] | undefined>();
  const [otherIncomeExpenseData, setOtherIncomeExpenseData] = useState<IncomeStatementRow[] | undefined>();
  const [lessExpenseData, setLessExpenseData] = useState<IncomeStatementRow[] | undefined>();
  const [incomeTaxData, setIncomeTaxData] = useState<IncomeStatementRow[] | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [printLoading, setPrintLoading] = useState<boolean>(false);

  // Sub-branch breakdown state (consolidated)
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  const [breakdownByBranch, setBreakdownByBranch] = useState<BreakdownData>({});

  /**
   * Helper to clear all income statement section data
   */
  const clearStatementData = () => {
    setIsInterestIncomeData(undefined);
    setIsOtherRevenueData(undefined);
    setDirectFinancingData(undefined);
    setOtherIncomeExpenseData(undefined);
    setLessExpenseData(undefined);
    setIncomeTaxData(undefined);
  };
 
  const fetchBalanceSheetData = async (startDate: Date | undefined, endDate: Date | undefined, branch_sub_id: string) => {
    // Validate dates before API call
    if (!startDate || !endDate) {
      toast.warning('Please select start and end dates');
      return;
    }

    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

    if (formattedStartDate === 'Invalid date' || formattedEndDate === 'Invalid date') {
      toast.error('Invalid date format');
      return;
    }

    setLoading(true);

    try {
      const variables: { startDate: string, endDate: string, branch_sub_id: string } = {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
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

      // Check for GraphQL errors
      if (response.errors && response.errors.length > 0) {
        console.error('Balance Sheet GraphQL errors:', response.errors);
        toast.error(response.errors[0].message || 'Failed to load Balance Sheet');
        setBalanceSheetData(undefined);
        return;
      }

      setBalanceSheetData(response.data?.getBalanceSheet);
    } catch (error) {
      console.error('Balance Sheet fetch error:', error);
      toast.error('Failed to load Balance Sheet data');
      setBalanceSheetData(undefined);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStatementData = async (startDate: Date | undefined, endDate: Date | undefined, branch_sub_id: string) => {
    // Validate dates before API call
    if (!startDate || !endDate) {
      toast.warning('Please select start and end dates');
      return;
    }

    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

    if (formattedStartDate === 'Invalid date' || formattedEndDate === 'Invalid date') {
      toast.error('Invalid date format');
      return;
    }

    setLoading(true);

    try {
      const variables: { startDate: string, endDate: string, branch_sub_id: string } = {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
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

      // Check for GraphQL errors
      if (response.errors && response.errors.length > 0) {
        console.error('Income Statement GraphQL errors:', response.errors);
        toast.error(response.errors[0].message || 'Failed to load Income Statement');
        clearStatementData();
        return;
      }

      // Validate response data exists
      const pivotData = response.data?.getIncomeStatement;
      if (!pivotData || !Array.isArray(pivotData)) {
        console.error('Invalid Income Statement response:', response);
        toast.error('Failed to load Income Statement: Invalid data format');
        return;
      }

      setIsInterestIncomeData(pivotData[0]);
      setIsOtherRevenueData(pivotData[1]);
      setDirectFinancingData(pivotData[2]);
      setOtherIncomeExpenseData(pivotData[3]);
      setLessExpenseData(pivotData[4]);
      setIncomeTaxData(pivotData[5]);
    } catch (error) {
      console.error('Income Statement fetch error:', error);
      toast.error('Failed to load Income Statement data');
      clearStatementData();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch Income Statement data with optional sub-branch breakdown.
   * Called when "All Sub-Branches" is selected and breakdown toggle is enabled.
   */
  const fetchStatementDataWithBreakdown = async (
    startDate: Date | undefined,
    endDate: Date | undefined,
    shouldShowBreakdown: boolean
  ) => {
    // Validate dates before API call
    if (!startDate || !endDate) {
      toast.warning('Please select start and end dates');
      return;
    }

    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

    if (formattedStartDate === 'Invalid date' || formattedEndDate === 'Invalid date') {
      toast.error('Invalid date format');
      return;
    }

    // Use global loading to show full-page spinner (same UX as changing dates/branch)
    setLoading(true);

    try {
      const variables = {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        show_breakdown: shouldShowBreakdown
      };

      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_INCOME_STATEMENT_WITH_BREAKDOWN,
          variables
        }),
      });

      // Check for GraphQL errors
      if (response.errors && response.errors.length > 0) {
        console.error('Income Statement with breakdown GraphQL errors:', response.errors);
        toast.error(response.errors[0].message || 'Failed to load Income Statement breakdown');
        setShowBreakdown(false);
        clearBreakdownData();
        return;
      }

      // Validate response data exists
      const breakdownData = response.data?.getIncomeStatementWithBreakdown;
      if (!breakdownData) {
        console.error('Invalid Income Statement breakdown response:', response);
        toast.error('Failed to load Income Statement: Invalid data format');
        setShowBreakdown(false);
        return;
      }

      // Set aggregated data
      setIsInterestIncomeData(breakdownData.interest_income);
      setIsOtherRevenueData(breakdownData.other_revenues);
      setDirectFinancingData(breakdownData.direct_financing);
      setLessExpenseData(breakdownData.less_expense);
      setOtherIncomeExpenseData(breakdownData.other_income_expense);
      setIncomeTaxData(breakdownData.income_tax);

      // Set showBreakdown AFTER data is populated so the breakdown section
      // only renders when its data is already in state (prevents empty header flash)
      setShowBreakdown(shouldShowBreakdown);

      // Set branch breakdown data (only populated when show_breakdown is true)
      if (shouldShowBreakdown) {
        setBreakdownByBranch({
          interestIncome: breakdownData.interest_income_by_branch,
          otherRevenues: breakdownData.other_revenues_by_branch,
          directFinancing: breakdownData.direct_financing_by_branch,
          lessExpense: breakdownData.less_expense_by_branch,
          otherIncomeExpense: breakdownData.other_income_expense_by_branch,
          incomeTax: breakdownData.income_tax_by_branch,
        });
      } else {
        clearBreakdownData();
      }
    } catch (error) {
      console.error('Income Statement with breakdown fetch error:', error);
      toast.error('Failed to load Income Statement breakdown data');
      setShowBreakdown(false);
      clearBreakdownData();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper to clear all breakdown data
   */
  const clearBreakdownData = () => {
    setBreakdownByBranch({});
  };

  const printIncomeStatement = async (
    startDate: Date | undefined,
    endDate: Date | undefined,
    branch_sub_id: string,
    show_breakdown: boolean = false
  ) => {
    // Open blank window IMMEDIATELY (synchronous, during user click)
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      toast.error('Please allow popups for this site to view PDFs');
      return null;
    }

    // Show loading spinner in new window
    newWindow.document.write(PDF_LOADING_HTML);
    newWindow.document.close();

    setPrintLoading(true);

    try {
      const variables = {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
        branch_sub_id,
        show_breakdown
      };

      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: PRINT_INCOME_STATEMENT, variables }),
      });

      // Check for GraphQL errors
      if (response.errors?.length > 0) {
        newWindow.close();
        toast.error(response.errors[0].message || 'Failed to generate PDF');
        return null;
      }

      // Validate PDF result
      const pdfResult = response.data?.printIncomeStatement;
      const validationError = validatePdfResult(pdfResult);
      if (validationError) {
        newWindow.close();
        toast.error(validationError);
        return null;
      }

      // Redirect window to PDF URL
      newWindow.location.href = pdfResult.url;
      toast.success('Income Statement PDF generated successfully!', { autoClose: 3000 });
      return pdfResult.url;

    } catch (error) {
      if (newWindow && !newWindow.closed) newWindow.close();
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(`Failed to generate PDF: ${message}`);
      return null;
    } finally {
      setPrintLoading(false);
    }
  };

  return {
    // Fetch functions
    fetchBalanceSheetData,
    fetchStatementData,
    fetchStatementDataWithBreakdown,
    printIncomeStatement,
    clearBreakdownData,
    // Balance sheet data
    balanceSheetData,
    // Income statement aggregated data
    isInterestIncomeData,
    isOtherRevenueData,
    directFinancingData,
    otherIncomeExpenseData,
    lessExpenseData,
    incomeTaxData,
    // Sub-branch breakdown data (consolidated)
    showBreakdown,
    setShowBreakdown,
    breakdownByBranch,
    // Loading states
    loading,
    printLoading,
  };
};

export default useFinancialStatement;