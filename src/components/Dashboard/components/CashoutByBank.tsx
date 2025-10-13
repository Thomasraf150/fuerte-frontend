
"use client";

import React, { useEffect, useState } from 'react';
import CardDataStats from "@/components/CardDataStats";
import { formatNumberComma } from '@/utils/helper';
import moment from 'moment';
import { FileText } from "react-feather";

interface SumProps {
  sumTixData: any;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const NetMovements: React.FC<SumProps> = ({sumTixData, startDate, endDate}) => {

  useEffect(() => {
    console.log(sumTixData, 'CashoutByBank');
  }, [sumTixData]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-1 lg:gap-2 md:gap-2">
        <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default bg-gray-200 dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="overflow-x-auto">
            <table className="w-full table-auto mb-4 min-w-[800px]">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th colSpan={6} className="px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  <h2 className="text-xl mb-2">BREAKDOWN OF CASH-OUT BY BANK ACCOUNT</h2>
                </th>
              </tr>
              <tr className=" dark:bg-meta-4">
                <th className="min-w-[120px] sm:min-w-[140px] lg:min-w-[160px] text-left py-4 font-medium text-black dark:text-white xl:pl-11">
                  BANK
                </th>
                <th className="min-w-[100px] sm:min-w-[120px] lg:min-w-[140px] text-left py-4 font-medium text-black dark:text-white">
                  DESCRIPTION
                </th>
                <th className="text-left min-w-[100px] sm:min-w-[120px] lg:min-w-[140px] py-4 font-medium text-black dark:text-white xl:pl-11">
                  ACCOUNT #
                </th>
                <th className="text-left min-w-[80px] sm:min-w-[100px] lg:min-w-[120px] py-4 font-medium text-black dark:text-white xl:pl-3">
                  COUNT
                </th>
                <th className="text-left min-w-[100px] sm:min-w-[120px] lg:min-w-[140px] py-4 font-medium text-black dark:text-white xl:pl-3">
                  OB
                </th>
                <th className="text-left min-w-[100px] sm:min-w-[120px] lg:min-w-[140px] py-4 font-medium text-black dark:text-white xl:pl-3">
                  CASH-OUT
                </th>
              </tr>
            </thead>
            <tbody>
              {sumTixData?.cashout_by_bank.map((item: any, i: number) => (
                <>
                  <tr key={i}>
                    <td className="border-b text-left border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                      {item.bank_name}
                    </td>
                    <td className="border-b text-left border-[#eee] px-3 py-4 dark:border-strokedark">
                      
                    </td>
                    <td className="border-b text-left border-[#eee] px-3 py-4 dark:border-strokedark">
                      
                    </td>
                    <td className="border-b text-left border-[#eee] px-3 py-4 dark:border-strokedark">
                      {item.loan_count}
                    </td>
                    <td className="border-b text-left border-[#eee] px-3 py-4 dark:border-strokedark">
                      {formatNumberComma(parseFloat(item.total_pn_balance) - parseFloat(item.total_collection))}
                    </td>
                    <td className="border-b text-left border-[#eee] px-3 py-4 dark:border-strokedark">
                      {formatNumberComma(parseFloat(item.total_net_cashout))}
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetMovements;