
"use client";

import React, { useEffect, useState } from 'react';
import CardDataStats from "@/components/CardDataStats";
import { formatToTwoDecimalPlaces, formatNumberComma } from '@/utils/helper';
import moment from 'moment';
import { FileText } from "react-feather";

interface SumProps {
  sumTixData: any;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const LoanByLoanType: React.FC<SumProps> = ({sumTixData, startDate, endDate}) => {

  useEffect(() => {
    console.log(sumTixData, ' LoanByLoanType');
  }, [sumTixData]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-1 lg:gap-2 md:gap-2">
        <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default bg-gray-200 dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="overflow-x-auto">
            <table className="w-full table-auto mb-4 min-w-[700px]">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th colSpan={5} className="px-4 py-4 font-medium text-black dark:text-white">
                  <h2 className="text-xl mb-2">BREAKDOWN OF LOANS BY LOAN TYPE</h2>
                </th>
              </tr>
              <tr className=" text-left dark:bg-meta-4">
                <th className="min-w-[140px] sm:min-w-[160px] lg:min-w-[180px] px-4 py-4 font-medium text-black dark:text-white">
                  TYPE
                </th>
                <th className="text-center min-w-[80px] sm:min-w-[100px] lg:min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                  COUNT
                </th>
                <th className="text-right min-w-[120px] sm:min-w-[140px] lg:min-w-[160px] px-4 py-4 font-medium text-black dark:text-white">
                  PRINCIPAL
                </th>
                <th className="text-right min-w-[120px] sm:min-w-[140px] lg:min-w-[160px] px-4 py-4 font-medium text-black dark:text-white">
                  CASH-OUT
                </th>
                <th className="text-right min-w-[100px] sm:min-w-[120px] lg:min-w-[140px] px-4 py-4 font-medium text-black dark:text-white">
                  UDI
                </th>
              </tr>
            </thead>
            <tbody>
            {sumTixData?.loan_type_bdown.map((item: any, i: number) => (
              <>
                <tr key={i}>
                  <td className="border-b border-[#eee] px-4 py-3 dark:border-strokedark">
                    {item.description}
                  </td>
                  <td className="border-b text-center border-[#eee] px-4 py-3 dark:border-strokedark">
                    {item.loan_count}
                  </td>
                  <td className="border-b text-right border-[#eee] px-4 py-3 dark:border-strokedark">
                    {'\u20B1'} {formatNumberComma(parseFloat(item.pn_amount))}
                  </td>
                  <td className="border-b text-right border-[#eee] px-4 py-3 dark:border-strokedark">
                    {'\u20B1'} {formatNumberComma(parseFloat(item.loan_proceeds))}
                  </td>
                  <td className="border-b text-right border-[#eee] px-4 py-3 dark:border-strokedark">
                    {'\u20B1'} {formatNumberComma(parseFloat(item.udi_balance))}
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

export default LoanByLoanType;