"use client";

import React, { useEffect, useState } from 'react';
import useTrialBalance from '@/hooks/useTrialBalance';
import { formatNumberComma } from '@/utils/helper';

const AdjustedTrialBalanceList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const { dataUtb } = useTrialBalance();
  
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
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-boxdark dark:text-boxdark">
                    Adjusted Trial Balance
                  </h3>
                </div>
                <div className="p-5 flex gap-x-2">  {/* Added flex and gap-x-2 */}
                  <div className="w-full mx-auto">
                    <div className="shadow-md overflow-hidden">
                      <div className="h-[700px] w-full overflow-auto">
                        <table className="min-w-full border-collapse">
                          {/* Table Header */}
                          <thead className="bg-gray-200 text-gray-700 text-sm sticky top-0">
                            <tr>
                              <th className="px-4 py-2 border bg-slate-50">Account Name</th>
                              <th className="px-4 py-2 border bg-slate-50">Account Number</th>
                              <th className="px-4 py-2 border bg-green-200">Debit</th>
                              <th className="px-4 py-2 border bg-green-200">Credit</th>
                              <th className="px-4 py-2 border bg-green-800 text-whiter">Adjusting Debit</th>
                              <th className="px-4 py-2 border bg-green-800 text-whiter">Adjusting Credit</th>
                              <th className="px-4 py-2 border bg-green-500 text-whiter">Adjusted Debit</th>
                              <th className="px-4 py-2 border bg-green-500 text-whiter">Adjusted Credit</th>
                            </tr>
                          </thead>
                          {/* Table Body */}
                          <tbody className="text-sm">
                            {dataUtb !== undefined ? (
                              <>
                                <tr className="even:bg-gray-50 hover:bg-gray-100">
                                  <td className="px-4 py-2 border bg-neutral-700 text-whiten" colSpan={8}>ASSETS</td> 
                                </tr>
                                {dataUtb.assets.length > 0 ? dataUtb.assets.map((item: any, i: number) => 
                                    <tr key={`${i}`} className="even:bg-gray-50 hover:bg-gray-100">
                                      <td className="px-4 py-2 border">{item?.account_name}</td> 
                                      <td className="px-4 py-2 border text-center">{item?.number}</td>
                                      <td className="px-4 py-2 border bg-green-200 text-right">{formatNumberComma(item?.total_debit)}</td>
                                      <td className="px-4 py-2 border bg-green-200 text-right">{formatNumberComma(item?.total_credit)}</td>
                                      <td className="px-4 py-2 border bg-green-800 text-whiter text-right">{formatNumberComma(item?.adj_debit)}</td>
                                      <td className="px-4 py-2 border bg-green-800 text-whiter text-right">{formatNumberComma(item?.adj_credit)}</td>
                                      <td className="px-4 py-2 border bg-green-500 text-whiter text-right">{formatNumberComma(item?.total_debit - item?.adj_debit)}</td>
                                      <td className="px-4 py-2 border bg-green-500 text-whiter text-right">{formatNumberComma(item?.total_credit - item?.adj_credit)}</td>
                                    </tr>
                                ) : (
                                  <tr className="even:bg-gray-50 hover:bg-gray-100">
                                    <td className="px-4 py-2 border text-boxdark-2 text-center" colSpan={8}>NO DATA</td> 
                                  </tr>
                                )}
                                <tr className="even:bg-gray-50 hover:bg-gray-100">
                                  <td className="px-4 py-2 border text-right">TOTAL ASSETS</td> 
                                  <td className="px-4 py-2 border" colSpan={1}></td>
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.assets.reduce((acc: number, item: any) => acc + (item?.total_debit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.assets.reduce((acc: number, item: any) => acc + (item?.total_credit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.assets.reduce((acc: number, item: any) => acc + (item?.adj_debit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.assets.reduce((acc: number, item: any) => acc + (item?.adj_credit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.assets.reduce((acc: number, item: any) => acc + ((item?.total_debit || 0) - (item?.adj_debit || 0)), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.assets.reduce((acc: number, item: any) => acc + ((item?.total_credit || 0) - (item?.adj_credit || 0)), 0).toFixed(2)))}
                                  </td> 
                                </tr>
                                <tr className="even:bg-gray-50 hover:bg-gray-100">
                                  <td className="px-4 py-2 border bg-neutral-700 text-whiten" colSpan={8}>LIABILITIES</td> 
                                </tr>
                                {dataUtb.liabilities.length > 0 ? dataUtb.liabilities.map((item: any, i: number) => 
                                  <tr key={`${i}`} className="even:bg-gray-50 hover:bg-gray-100">
                                    <td className="px-4 py-2 border">{item?.account_name}</td> 
                                    <td className="px-4 py-2 border text-center">{item?.number}</td>
                                    <td className="px-4 py-2 border bg-green-200 text-right">{item?.total_debit}</td>
                                    <td className="px-4 py-2 border bg-green-200 text-right">{item?.total_credit}</td>
                                    <td className="px-4 py-2 border bg-green-800 text-whiter text-right">{item?.adj_debit}</td>
                                    <td className="px-4 py-2 border bg-green-800 text-whiter text-right">{item?.adj_credit}</td>
                                    <td className="px-4 py-2 border bg-green-500 text-whiter text-right">{item?.total_debit - item?.adj_debit}</td>
                                    <td className="px-4 py-2 border bg-green-500 text-whiter text-right">{item?.total_credit - item?.adj_credit}</td>
                                  </tr>
                                ) : (
                                  <tr className="even:bg-gray-50 hover:bg-gray-100">
                                    <td className="px-4 py-2 border text-boxdark-2 text-center" colSpan={8}>NO DATA</td> 
                                  </tr>
                                )}
                                <tr className="even:bg-gray-50 hover:bg-gray-100">
                                  <td className="px-4 py-2 border text-right">TOTAL LIABILITIES</td> 
                                  <td className="px-4 py-2 border" colSpan={1}></td>
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.liabilities.reduce((acc: number, item: any) => acc + (item?.total_debit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.liabilities.reduce((acc: number, item: any) => acc + (item?.total_credit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.liabilities.reduce((acc: number, item: any) => acc + (item?.adj_debit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.liabilities.reduce((acc: number, item: any) => acc + (item?.adj_credit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.liabilities.reduce((acc: number, item: any) => acc + ((item?.total_debit || 0) - (item?.adj_debit || 0)), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.liabilities.reduce((acc: number, item: any) => acc + ((item?.total_credit || 0) - (item?.adj_credit || 0)), 0).toFixed(2)))}
                                  </td> 
                                </tr>
                                <tr className="even:bg-gray-50 hover:bg-gray-100">
                                  <td className="px-4 py-2 border bg-neutral-700 text-whiten" colSpan={8}>CAPITAL</td> 
                                </tr>
                                {dataUtb.capital.length > 0 ? dataUtb.capital.map((item: any, i: number) => 
                                  <tr key={`${i}`} className="even:bg-gray-50 hover:bg-gray-100">
                                    <td className="px-4 py-2 border">{item?.account_name}</td> 
                                    <td className="px-4 py-2 border text-center">{item?.number}</td>
                                    <td className="px-4 py-2 border bg-green-200 text-right">{formatNumberComma(item?.total_debit)}</td>
                                    <td className="px-4 py-2 border bg-green-200 text-right">{formatNumberComma(item?.total_credit)}</td>
                                    <td className="px-4 py-2 border bg-green-800 text-whiter text-right">{formatNumberComma(item?.adj_debit)}</td>
                                    <td className="px-4 py-2 border bg-green-800 text-whiter text-right">{formatNumberComma(item?.adj_credit)}</td>
                                    <td className="px-4 py-2 border bg-green-500 text-whiter text-right">{formatNumberComma(item?.total_debit - item?.adj_debit)}</td>
                                    <td className="px-4 py-2 border bg-green-500 text-whiter text-right">{formatNumberComma(item?.total_credit - item?.adj_credit)}</td>
                                  </tr>
                                ) : (
                                  <tr className="even:bg-gray-50 hover:bg-gray-100">
                                    <td className="px-4 py-2 border text-boxdark-2 text-center" colSpan={8}>NO DATA</td> 
                                  </tr>
                                )}
                                <tr className="even:bg-gray-50 hover:bg-gray-100">
                                  <td className="px-4 py-2 border text-right">TOTAL CAPITAL</td> 
                                  <td className="px-4 py-2 border" colSpan={1}></td>
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.capital.reduce((acc: number, item: any) => acc + (item?.total_debit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.capital.reduce((acc: number, item: any) => acc + (item?.total_credit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.capital.reduce((acc: number, item: any) => acc + (item?.adj_debit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.capital.reduce((acc: number, item: any) => acc + (item?.adj_credit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.capital.reduce((acc: number, item: any) => acc + ((item?.total_debit || 0) - (item?.adj_debit || 0)), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.capital.reduce((acc: number, item: any) => acc + ((item?.total_credit || 0) - (item?.adj_credit || 0)), 0).toFixed(2)))}
                                  </td> 
                                </tr>
                                <tr className="even:bg-gray-50 hover:bg-gray-100">
                                  <td className="px-4 py-2 border bg-neutral-700 text-whiten" colSpan={8}>REVENUE</td> 
                                </tr>
                                {dataUtb.revenue.length > 0 ? dataUtb.revenue.map((item: any, i: number) => 
                                  <tr key={`${i}`} className="even:bg-gray-50 hover:bg-gray-100">
                                    <td className="px-4 py-2 border">{item?.account_name}</td> 
                                    <td className="px-4 py-2 border text-center">{item?.number}</td>
                                    <td className="px-4 py-2 border bg-green-200 text-right">{formatNumberComma(item?.total_debit)}</td>
                                    <td className="px-4 py-2 border bg-green-200 text-right">{formatNumberComma(item?.total_credit)}</td>
                                    <td className="px-4 py-2 border bg-green-800 text-whiter text-right">{formatNumberComma(item?.adj_debit)}</td>
                                    <td className="px-4 py-2 border bg-green-800 text-whiter text-right">{formatNumberComma(item?.adj_credit)}</td>
                                    <td className="px-4 py-2 border bg-green-500 text-whiter text-right">{formatNumberComma(item?.total_debit - item?.adj_debit)}</td>
                                    <td className="px-4 py-2 border bg-green-500 text-whiter text-right">{formatNumberComma(item?.total_credit - item?.adj_credit)}</td>
                                  </tr>
                                ) : (
                                  <tr className="even:bg-gray-50 hover:bg-gray-100">
                                    <td className="px-4 py-2 border text-boxdark-2 text-center" colSpan={8}>NO DATA</td> 
                                  </tr>
                                )}
                                <tr className="even:bg-gray-50 hover:bg-gray-100">
                                  <td className="px-4 py-2 border text-right">TOTAL REVENUE</td> 
                                  <td className="px-4 py-2 border" colSpan={1}></td>
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.revenue.reduce((acc: number, item: any) => acc + (item?.total_debit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.revenue.reduce((acc: number, item: any) => acc + (item?.total_credit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.revenue.reduce((acc: number, item: any) => acc + (item?.adj_debit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.revenue.reduce((acc: number, item: any) => acc + (item?.adj_credit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.revenue.reduce((acc: number, item: any) => acc + ((item?.total_debit || 0) - (item?.adj_debit || 0)), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.revenue.reduce((acc: number, item: any) => acc + ((item?.total_credit || 0) - (item?.adj_credit || 0)), 0).toFixed(2)))}
                                  </td> 
                                </tr>
                                <tr className="even:bg-gray-50 hover:bg-gray-100">
                                  <td className="px-4 py-2 border bg-neutral-700 text-whiten" colSpan={8}>EXPENSES</td> 
                                </tr>
                                {dataUtb.expenses.length > 0 ? dataUtb.expenses.map((item: any, i: number) => 
                                  <tr key={`${i}`} className="even:bg-gray-50 hover:bg-gray-100">
                                    <td className="px-4 py-2 border">{item?.account_name}</td> 
                                    <td className="px-4 py-2 border text-center">{item?.number}</td>
                                    <td className="px-4 py-2 border bg-green-200 text-right">{formatNumberComma(item?.total_debit)}</td>
                                    <td className="px-4 py-2 border bg-green-200 text-right">{formatNumberComma(item?.total_credit)}</td>
                                    <td className="px-4 py-2 border bg-green-800 text-whiter text-right">{formatNumberComma(item?.adj_debit)}</td>
                                    <td className="px-4 py-2 border bg-green-800 text-whiter text-right">{formatNumberComma(item?.adj_credit)}</td>
                                    <td className="px-4 py-2 border bg-green-500 text-whiter text-right">{formatNumberComma(item?.total_debit - item?.adj_debit)}</td>
                                    <td className="px-4 py-2 border bg-green-500 text-whiter text-right">{formatNumberComma(item?.total_credit - item?.adj_credit)}</td>
                                  </tr>
                                ) : (
                                  <tr className="even:bg-gray-50 hover:bg-gray-100">
                                    <td className="px-4 py-2 border text-boxdark-2 text-center" colSpan={8}>NO DATA</td> 
                                  </tr>
                                )}
                                <tr className="even:bg-gray-50 hover:bg-gray-100">
                                  <td className="px-4 py-2 border text-right">TOTAL EXPENSES</td> 
                                  <td className="px-4 py-2 border" colSpan={1}></td>
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.expenses.reduce((acc: number, item: any) => acc + (item?.total_debit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.expenses.reduce((acc: number, item: any) => acc + (item?.total_credit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.expenses.reduce((acc: number, item: any) => acc + (item?.adj_debit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.expenses.reduce((acc: number, item: any) => acc + (item?.adj_credit || 0), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.expenses.reduce((acc: number, item: any) => acc + ((item?.total_debit || 0) - (item?.adj_debit || 0)), 0).toFixed(2)))}
                                  </td> 
                                  <td className="px-4 py-2 border text-right">
                                    {formatNumberComma(parseFloat(dataUtb.expenses.reduce((acc: number, item: any) => acc + ((item?.total_credit || 0) - (item?.adj_credit || 0)), 0).toFixed(2)))}
                                  </td> 
                                </tr>
                              </>
                            ) : (
                              <tr>
                                <td colSpan={4} className="text-center py-2 border">No data available</td>
                              </tr>
                            )}
                          </tbody>
                          {/* Table Footer - Totals */}
                          {/* <tfoot className="bg-gray-200 text-gray-700 text-sm sticky bottom-0">
                            <tr className="bg-gray-100 font-semibold">
                              <td className="px-4 py-2 border text-right bg-slate-50" colSpan={2}>Total:</td>
                              <td className="px-4 py-2 border text-right bg-slate-50">
                                {dataUtb?.reduce((acc, item) => acc + (Number(item?.total_debit) || 0), 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-2 border text-right bg-slate-50">
                                {dataUtb?.reduce((acc, item) => acc + (Number(item?.total_credit) || 0), 0).toFixed(2)}
                              </td>
                            </tr>
                          </tfoot> */}
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default AdjustedTrialBalanceList;