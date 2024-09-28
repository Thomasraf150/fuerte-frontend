
"use client";

import React, { useEffect, useState } from 'react';
import CardDataStats from "@/components/CardDataStats";
import { formatToTwoDecimalPlaces } from '@/utils/helper';
import moment from 'moment';
import { FileText } from "react-feather";

interface SumProps {
  sumTixData: any;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const LoanByLoanType: React.FC<SumProps> = ({sumTixData, startDate, endDate}) => {

  useEffect(() => {
    console.log(sumTixData, ' sumTixData');
  }, [sumTixData]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-1 lg:gap-2 md:gap-2">
        <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default bg-gray-200 dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <table className="w-full table-auto mb-4">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th colSpan={5} className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  <h2 className="text-xl mb-2">BREAKDOWN OF LOANS BY LOAN TYPE</h2>
                </th>
              </tr>
              <tr className=" text-left dark:bg-meta-4">
                <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  TYPE
                </th>
                <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white">
                  COUNT
                </th>
                <th className="text-left min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-3">
                  PRINCIPAL
                </th>
                <th className="text-left min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-3">
                  CASH-OUT
                </th>
                <th className="text-left min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-3">
                  UDI
                </th>
              </tr>
            </thead>
            <tbody>
            {sumTixData?.loan_type_bdown.map((item: any, i: number) => (
              <>
                <tr key={i}>
                  <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                    {item.description}
                  </td>
                  <td className="border-b border-[#eee] px-3 py-4 dark:border-strokedark">
                    {item.loan_count}
                  </td>
                  <td className="border-b text-left border-[#eee] px-3 py-4 dark:border-strokedark">
                    {item.pn_amount}
                  </td>
                  <td className="border-b text-left border-[#eee] px-3 py-4 dark:border-strokedark">
                    {item.loan_proceeds}
                  </td>
                  <td className="border-b text-left border-[#eee] px-3 py-4 dark:border-strokedark">
                    {item.udi_balance}
                  </td>
                </tr>
              </>
            ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoanByLoanType;