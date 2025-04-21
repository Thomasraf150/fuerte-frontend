"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { DataLoanProceedList, DataAccBalanceSheet, DataAccIncomeStatement } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import FinancialStatementQueryMutations from '@/graphql/FinancialStatementQueryMutations';
import { fetchWithRecache } from '@/utils/helper';
import moment from 'moment';

const useFinancialStatement = () => {
  const { GET_BALANCE_SHEET, GET_INCOME_STATEMENT } = FinancialStatementQueryMutations;

  const [balanceSheetData, setBalanceSheetData] = useState<DataAccBalanceSheet>();
  const [isInterestIncomeData, setIsInterestIncomeData] = useState<any>();
  const [isOtherRevenueData, setIsOtherRevenueData] = useState<any>();
  const [directFinancingData, setDirectFinancingData] = useState<any>();
  const [otherIncomeExpenseData, setOtherIncomeExpenseData] = useState<any>();
  const [lessExpenseData, setLessExpenseData] = useState<any>();
  const [incomeTaxData, setIncomeTaxData] = useState<any>();
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
 
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

  useEffect(() => {
    // fetchBalanceSheetData();
    // fetchStatementData();
  }, []);

  return {
    fetchBalanceSheetData,
    fetchStatementData,
    balanceSheetData,
    isInterestIncomeData,
    isOtherRevenueData,
    directFinancingData,
    otherIncomeExpenseData,
    lessExpenseData,
    incomeTaxData,
    loading,
  };
};

export default useFinancialStatement;