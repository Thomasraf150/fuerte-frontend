"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import useFinancialStatement from '@/hooks/useFinancialStatement';
import { GitBranch, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { DataLoanProceedList, DataAccBalanceSheet } from '@/utils/DataTypes';

const IncomeStatementList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const { incomeStatementData } = useFinancialStatement();
  
  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }

  useEffect(() => {

    console.log(incomeStatementData, ' incomeStatementData');
  }, [incomeStatementData])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
          <div className={`col-span-2`}>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2 ">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-boxdark dark:text-boxdark">
                  Income Statement
                </h3>
              </div>
              <div className="overflow-x-auto shadow-md sm:rounded-lg p-5 overflow-y-auto min-h-[300px] h-[600px]">
                {incomeStatementData!== undefined ? (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-700">Revenue</h2>
                        <ul>
                            { incomeStatementData?.revenues?.map((item: any) => (
                                <li key={item.number} className="ml-4 border-l-4 pl-2">
                                    <strong>{item.account_name}:</strong> ₱{item.balance.toFixed(2)}
                                    {item.children && (
                                        <ul className="ml-4">
                                            {item.subAccounts.map((child: any) => (
                                                <li key={child.number} className="ml-4">
                                                    {child.account_name}: ₱{child.balance.toFixed(2)}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            )
                            )}
                        </ul>
                    </div>
                ) : (
                    <p className="text-gray-500">Loading...</p>
                )}
                {incomeStatementData!== undefined ? (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-700">Expense</h2>
                        <ul>
                            { incomeStatementData?.expenses?.map((item: any) => (
                                <li key={item.number} className="ml-4 border-l-4 pl-2">
                                    <strong>{item.account_name}:</strong> ₱{item.balance.toFixed(2)}
                                    {item.children && (
                                        <ul className="ml-4">
                                            {item.subAccounts.map((child: any) => (
                                                <li key={child.number} className="ml-4">
                                                    {child.account_name}: ₱{child.balance.toFixed(2)}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            )
                            )}
                        </ul>
                    </div>
                ) : (
                    <p className="text-gray-500">Loading...</p>
                )}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-sm font-semibold text-gray-700">Total Revenue</h4>
                  <ul>
                    <li className="ml-4 border-l-4 pl-2">{incomeStatementData && parseFloat(incomeStatementData?.total_revenue).toFixed(2)}</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-sm font-semibold text-gray-700">Total Expense</h4>
                  <ul>
                    <li className="ml-4 border-l-4 pl-2">{incomeStatementData && parseFloat(incomeStatementData?.total_expense).toFixed(2)}</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-sm font-semibold text-gray-700">Total Income</h4>
                  <ul>
                    <li className="ml-4 border-l-4 pl-2">{incomeStatementData && parseFloat(incomeStatementData?.net_income).toFixed(2)}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IncomeStatementList;