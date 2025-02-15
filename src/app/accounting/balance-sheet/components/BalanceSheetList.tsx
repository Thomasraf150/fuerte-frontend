"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import useFinancialStatement from '@/hooks/useFinancialStatement';
import { GitBranch, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { DataLoanProceedList, DataAccBalanceSheet } from '@/utils/DataTypes';

const BalanceSheetList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const { balanceSheetData } = useFinancialStatement();
  
  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }

  useEffect(() => {

    console.log(balanceSheetData, ' balanceSheetData');
  }, [balanceSheetData])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
          <div className={`col-span-2`}>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2 ">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-boxdark dark:text-boxdark">
                  Balance Sheet
                </h3>
              </div>
              <div className="overflow-x-auto shadow-md sm:rounded-lg p-5 overflow-y-auto min-h-[300px] h-[600px]">
                {balanceSheetData!== undefined ? (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-700">Assets</h2>
                        <ul>
                            { balanceSheetData && balanceSheetData?.assets?.map((item: any) => (
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
                {balanceSheetData!== undefined ? (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-700">Liabilities</h2>
                        <ul>
                            { balanceSheetData?.liabilities?.map((item: any) => (
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
                {balanceSheetData!== undefined ? (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-700">Equity</h2>
                        <ul>
                            { balanceSheetData?.equity?.map((item: any) => (
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
                  <h4 className="text-sm font-semibold text-gray-700">Total Assets</h4>
                  <ul>
                    <li className="ml-4 border-l-4 pl-2">{balanceSheetData && parseFloat(String(balanceSheetData?.total_assets)).toFixed(2)}</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-sm font-semibold text-gray-700">Total Liabilities</h4>
                  <ul>
                    <li className="ml-4 border-l-4 pl-2">{balanceSheetData && parseFloat(String(balanceSheetData?.total_liabilities)).toFixed(2)}</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-sm font-semibold text-gray-700">Total Equity</h4>
                  <ul>
                    <li className="ml-4 border-l-4 pl-2">{balanceSheetData && parseFloat(String(balanceSheetData?.total_equity)).toFixed(2)}</li>
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

export default BalanceSheetList;