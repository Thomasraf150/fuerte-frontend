"use client";

import { Card, CardBody } from '@/components/Card';
import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import UtbForm from './UtbForm';
import useFinancialStatement from '@/hooks/useFinancialStatement';
import useTrialBalance from '@/hooks/useTrialBalance';
import { GitBranch, Plus } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { DataLoanProceedList, DataAccBalanceSheet } from '@/utils/DataTypes';
import { formatNumberComma } from '@/utils/helper';
import TrialBalanceSkeleton from '@/components/LoadingStates/TrialBalanceSkeleton';

const UnadjustedTrialBalanceList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const { dataUtb, loading } = useTrialBalance();
  
  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }

  useEffect(() => {
  }, [dataUtb])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-2 gap-4">
          {!showForm && (
            <div className={`col-span-2`}>
              <Card>
                <CardBody>
                  <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                          {/* Table Header */}
                          <thead className="bg-gray-2 dark:bg-meta-4 text-body dark:text-bodydark text-sm sticky top-0">
                            <tr>
                              <th className="px-4 py-2 border dark:border-strokedark bg-slate-50 dark:bg-meta-4">Account Name</th>
                              <th className="px-4 py-2 border dark:border-strokedark bg-slate-50 dark:bg-meta-4">Account Number</th>
                              <th className="px-4 py-2 border dark:border-strokedark bg-slate-50 dark:bg-meta-4">Debit</th>
                              <th className="px-4 py-2 border dark:border-strokedark bg-slate-50 dark:bg-meta-4">Credit</th>
                            </tr>
                          </thead>
                          {/* Table Body */}
                          <tbody className="text-sm">
                            {loading ? (
                              <tr>
                                <td colSpan={4} className="p-0 border-0">
                                  <TrialBalanceSkeleton rows={15} columns={4} />
                                </td>
                              </tr>
                            ) : dataUtb !== undefined ? (
                              <>
                                <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                  <td className="px-4 py-2 border dark:border-strokedark bg-neutral-700 dark:bg-neutral-600 text-whiten" colSpan={4}>ASSETS</td>
                                </tr>
                                {dataUtb.assets.length > 0 ? dataUtb.assets.map((item: any, i: number) =>
                                    <tr key={`${i}`} className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                      <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark">{item?.account_name}</td>
                                      <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-center">{item?.number}</td>
                                      <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">{formatNumberComma(item?.total_debit)}</td>
                                      <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">{formatNumberComma(item?.total_credit)}</td>
                                    </tr>
                                ) : (
                                  <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                    <td className="px-4 py-2 border dark:border-strokedark text-boxdark-2 dark:text-bodydark text-center" colSpan={4}>NO DATA</td>
                                  </tr>
                                )}
                                <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4 font-bold">
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">TOTAL ASSETS</td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark" colSpan={1}></td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">
                                    {formatNumberComma(parseFloat(dataUtb.assets.reduce((acc: number, item: any) => acc + (item?.total_debit || 0), 0).toFixed(2)))}
                                  </td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">
                                    {formatNumberComma(parseFloat(dataUtb.assets.reduce((acc: number, item: any) => acc + (item?.total_credit || 0), 0).toFixed(2)))}
                                  </td>
                                </tr>
                                <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                  <td className="px-4 py-2 border dark:border-strokedark bg-neutral-700 dark:bg-neutral-600 text-whiten" colSpan={4}>LIABILITIES</td>
                                </tr>
                                {dataUtb.liabilities.length > 0 ? dataUtb.liabilities.map((item: any, i: number) =>
                                  <tr key={`${i}`} className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark">{item?.account_name}</td>
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-center">{item?.number}</td>
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">{formatNumberComma(item?.total_debit)}</td>
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">{formatNumberComma(item?.total_credit)}</td>
                                  </tr>
                                ) : (
                                  <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                    <td className="px-4 py-2 border dark:border-strokedark text-boxdark-2 dark:text-bodydark text-center" colSpan={4}>NO DATA</td>
                                  </tr>
                                )}
                                <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4 font-bold">
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">TOTAL LIABILITIES</td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark" colSpan={1}></td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">
                                    {formatNumberComma(parseFloat(dataUtb.liabilities.reduce((acc: number, item: any) => acc + (item?.total_debit || 0), 0).toFixed(2)))}
                                  </td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">
                                    {formatNumberComma(parseFloat(dataUtb.liabilities.reduce((acc: number, item: any) => acc + (item?.total_credit || 0), 0).toFixed(2)))}
                                  </td>
                                </tr>
                                <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                  <td className="px-4 py-2 border dark:border-strokedark bg-neutral-700 dark:bg-neutral-600 text-whiten" colSpan={4}>CAPITAL</td>
                                </tr>
                                {dataUtb.capital.length > 0 ? dataUtb.capital.map((item: any, i: number) =>
                                  <tr key={`${i}`} className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark">{item?.account_name}</td>
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-center">{item?.number}</td>
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">{formatNumberComma(item?.total_debit)}</td>
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">{formatNumberComma(item?.total_credit)}</td>
                                  </tr>
                                ) : (
                                  <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                    <td className="px-4 py-2 border dark:border-strokedark text-boxdark-2 dark:text-bodydark text-center" colSpan={4}>NO DATA</td>
                                  </tr>
                                )}
                                <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4 font-bold">
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">TOTAL CAPITAL</td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark" colSpan={1}></td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">
                                    {formatNumberComma(parseFloat(dataUtb.capital.reduce((acc: number, item: any) => acc + (item?.total_debit || 0), 0).toFixed(2)))}
                                  </td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">
                                    {formatNumberComma(parseFloat(dataUtb.capital.reduce((acc: number, item: any) => acc + (item?.total_credit || 0), 0).toFixed(2)))}
                                  </td>
                                </tr>
                                <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                  <td className="px-4 py-2 border dark:border-strokedark bg-neutral-700 dark:bg-neutral-600 text-whiten" colSpan={4}>REVENUE</td>
                                </tr>
                                {dataUtb.revenue.length > 0 ? dataUtb.revenue.map((item: any, i: number) =>
                                  <tr key={`${i}`} className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark">{item?.account_name}</td>
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-center">{item?.number}</td>
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">{formatNumberComma(item?.total_debit)}</td>
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">{formatNumberComma(item?.total_credit)}</td>
                                  </tr>
                                ) : (
                                  <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                    <td className="px-4 py-2 border dark:border-strokedark text-boxdark-2 dark:text-bodydark text-center" colSpan={4}>NO DATA</td>
                                  </tr>
                                )}
                                <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4 font-bold">
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">TOTAL REVENUE</td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark" colSpan={1}></td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">
                                    {formatNumberComma(parseFloat(dataUtb.revenue.reduce((acc: number, item: any) => acc + (item?.total_debit || 0), 0).toFixed(2)))}
                                  </td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">
                                    {formatNumberComma(parseFloat(dataUtb.revenue.reduce((acc: number, item: any) => acc + (item?.total_credit || 0), 0).toFixed(2)))}
                                  </td>
                                </tr>
                                <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                  <td className="px-4 py-2 border dark:border-strokedark bg-neutral-700 dark:bg-neutral-600 text-whiten" colSpan={4}>EXPENSES</td>
                                </tr>
                                {dataUtb.expenses.length > 0 ? dataUtb.expenses.map((item: any, i: number) =>
                                  <tr key={`${i}`} className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark">{item?.account_name}</td>
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-center">{item?.number}</td>
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">{formatNumberComma(item?.total_debit)}</td>
                                    <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">{formatNumberComma(item?.total_credit)}</td>
                                  </tr>
                                ) : (
                                  <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4">
                                    <td className="px-4 py-2 border dark:border-strokedark text-boxdark-2 dark:text-bodydark text-center" colSpan={4}>NO DATA</td>
                                  </tr>
                                )}
                                <tr className="even:bg-gray-3 dark:even:bg-boxdark hover:bg-gray-2 dark:hover:bg-meta-4 font-bold">
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">TOTAL EXPENSES</td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark" colSpan={1}></td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">
                                    {formatNumberComma(parseFloat(dataUtb.expenses.reduce((acc: number, item: any) => acc + (item?.total_debit || 0), 0).toFixed(2)))}
                                  </td>
                                  <td className="px-4 py-2 border dark:border-strokedark dark:text-bodydark text-right">
                                    {formatNumberComma(parseFloat(dataUtb.expenses.reduce((acc: number, item: any) => acc + (item?.total_credit || 0), 0).toFixed(2)))}
                                  </td>
                                </tr>
                              </>
                            ) : (
                              <tr>
                                <td colSpan={4} className="text-center py-2 border dark:border-strokedark dark:text-bodydark">No data available</td>
                              </tr>
                            )}
                          </tbody>
                          {/* Table Footer - Totals */}
                          {/* <tfoot className="bg-gray-2 text-black text-sm sticky bottom-0">
                            <tr className="bg-gray-2 font-semibold">
                              <td className="px-4 py-2 border text-right bg-slate-50" colSpan={2}>Total:</td>
                              <td className="px-4 py-2 border text-right bg-slate-50">
                                {formatNumberComma(dataUtb?.reduce((acc, item) => acc + (Number(item?.total_debit) || 0), 0) ?? 0)}
                              </td>
                              <td className="px-4 py-2 border text-right bg-slate-50">
                                {formatNumberComma(dataUtb?.reduce((acc, item) => acc + (Number(item?.total_credit) || 0), 0) ?? 0)}
                              </td>
                            </tr>
                          </tfoot> */}
                        </table>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
          {showForm && (
            <div className={`col-span-2`}>
              <Card>
                <CardBody>
                  <UtbForm />
                </CardBody>
              </Card>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default UnadjustedTrialBalanceList;