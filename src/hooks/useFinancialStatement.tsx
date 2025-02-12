"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { DataLoanProceedList, DataAccBalanceSheet } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import FinancialStatementQueryMutations from '@/graphql/FinancialStatementQueryMutations';
import { fetchWithRecache } from '@/utils/helper';

const useFinancialStatement = () => {
  const { GET_BALANCE_SHEET, GET_INCOME_STATEMENT } = FinancialStatementQueryMutations;

  const [balanceSheetData, setBalanceSheetData] = useState<DataAccBalanceSheet[]>();
  const [incomeStatementData, setIncomeStatementData] = useState<DataAccBalanceSheet[]>();
  const [loading, setLoading] = useState<boolean>(false);
 
  const fetchBalanceSheetData = async () => {
    setLoading(true);

    let variables: { date: string } = {
      date : "2025-02-27"
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
  
  const fetchStatementData = async () => {
    setLoading(true);

    let variables: { startDate: string, endDate: string } = {
      startDate : "2025-01-27",
      endDate: "2025-02-27"
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
    setIncomeStatementData(response.data.getIncomeStatement);
    setLoading(false);
  };

  useEffect(() => {
    fetchBalanceSheetData();
    fetchStatementData();
  }, []);

  return {
    fetchBalanceSheetData,
    fetchStatementData,
    balanceSheetData,
    incomeStatementData,
    loading,
  };
};

export default useFinancialStatement;