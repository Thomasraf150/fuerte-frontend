"use client";

import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { formatToTwoDecimalPlaces } from '@/utils/helper';
import { toCamelCase, formatNumberComma } from '@/utils/helper';

interface SumProps {
  sumTixData: any;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const SummaryTicket: React.FC<SumProps> = ({sumTixData, startDate, endDate}) => {

  const [totals, setTotals] = useState({
    totalDebit: 0,
    totalCredit: 0,
  });

  useEffect(() => {
    if (sumTixData?.summary_tix) {
      const calculatedTotals = sumTixData.summary_tix
        ?.filter((item: any) => item.description?.trim().toLowerCase() !== 'addon total')
        .reduce(
        (acc: any, item: any) => {
          return {
            totalDebit: parseFloat(acc.totalDebit) + parseFloat((item.debit || 0)),
            totalCredit: parseFloat(acc.totalCredit) + parseFloat((item.credit || 0)),
          };
        },
        { totalDebit: 0, totalCredit: 0 } // Initial values for debit and credit
      );

      setTotals(calculatedTotals);
    }
    console.log(SummaryTicket, 'sumTixData');
  }, [sumTixData]);

  const customOrder = ['notes receivable', 'udi', 'processing', 
                      'agent fee', 'collection', 'insurance', 'notarial', 
                      'outstanding balance', 'penalty', 'rebates', 'addon amount', 
                      'addon udi', 'addon total', 'cash in bank']; 

  return (
    <div>
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default bg-gray-200 dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <table className="w-full table-auto mb-4">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th colSpan={4} className="text-center min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  <h2 className="text-xl mb-2">Summary Ticket as of</h2>{moment(startDate).format('LL')} - {moment(endDate).format('LL')}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  No of Transaction
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  {sumTixData && sumTixData?.summary_tix[4]?.ccount}
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                </td>
              </tr>
              {sumTixData?.summary_tix?.filter((item: any) => item.description?.trim().toLowerCase() !== 'addon total')
                  ?.sort((a: any, b: any) => customOrder.indexOf(a.description) - customOrder.indexOf(b.description))
                  .map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                      {item.description === 'cash in bank' ? 'Cash Out' : toCamelCase(item.description)}
                    </td>
                    <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                    </td>
                    <td className="border-b text-right border-[#eee] px-3 py-4 dark:border-strokedark">
                      {'\u20B1'} {formatNumberComma(Number(item.debit))}
                    </td>
                    <td className="border-b text-right border-[#eee] px-3 py-4 dark:border-strokedark">
                      {'\u20B1'} {formatNumberComma(Number(item.credit))}
                    </td>
                  </tr>
              ))}
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11 text-strokedark bg-yellow-500">
                  CONTROL TOTALS
                </td>
                <td className="border-b text-right border-[#eee] px-3 py-4 dark:border-strokedark text-strokedark bg-yellow-500">
                  
                </td>
                <td className="border-b text-right border-[#eee] px-3 py-4 dark:border-strokedark text-strokedark bg-yellow-500">
                  {'\u20B1'} {formatNumberComma(totals?.totalDebit)}
                </td>
                <td className="border-b text-right border-[#eee] px-3 py-4 dark:border-strokedark text-strokedark bg-yellow-500">
                  {'\u20B1'} {formatNumberComma(totals?.totalCredit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
    </div>
  );
};

export default SummaryTicket;