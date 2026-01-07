"use client";

import React from 'react';
import { formatNumberComma, formatDateRange } from '@/utils/helper';

interface BranchBreakdownData {
  branch_sub_id: number;
  branch_name: string;
  branch_code: string;
  description: string;
  ccount: number;
  debit: string;
  credit: string;
}

interface BranchBreakdownProps {
  data: BranchBreakdownData[];
  startDate: Date | undefined;
  endDate: Date | undefined;
}

interface BranchGroup {
  branch_name: string;
  branch_code: string;
  details: BranchBreakdownData[];
  totalDebit: number;
  totalCredit: number;
}

const SummaryTicketByBranch: React.FC<BranchBreakdownProps> = ({ data, startDate, endDate }) => {
  // Group data by branch
  const branchGroups = data.reduce<Record<number, BranchGroup>>((acc, item) => {
    const branchKey = item.branch_sub_id;
    if (!acc[branchKey]) {
      acc[branchKey] = {
        branch_name: item.branch_name,
        branch_code: item.branch_code,
        details: [],
        totalDebit: 0,
        totalCredit: 0,
      };
    }
    acc[branchKey].details.push(item);
    acc[branchKey].totalDebit += parseFloat(item.debit || '0');
    acc[branchKey].totalCredit += parseFloat(item.credit || '0');
    return acc;
  }, {});

  // Calculate grand totals
  const grandTotalDebit = Object.values(branchGroups).reduce(
    (sum, branch) => sum + branch.totalDebit, 0
  );
  const grandTotalCredit = Object.values(branchGroups).reduce(
    (sum, branch) => sum + branch.totalCredit, 0
  );

  return (
    <div className="mt-6">
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default bg-gray-200 dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="overflow-x-auto">
          <table className="w-full table-auto mb-4 min-w-[800px]">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th colSpan={4} className="text-center px-4 py-4 font-medium text-black dark:text-white">
                  <h2 className="text-xl mb-2">SUMMARY BY BRANCH</h2>
                  <span className="text-sm font-normal">
                    {formatDateRange(startDate, endDate)}
                  </span>
                </th>
              </tr>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="min-w-[220px] px-4 py-3 font-medium text-black dark:text-white">DESCRIPTION</th>
                <th className="text-center min-w-[100px] px-4 py-3 font-medium text-black dark:text-white">COUNT</th>
                <th className="text-right min-w-[140px] px-4 py-3 font-medium text-black dark:text-white">DEBIT</th>
                <th className="text-right min-w-[140px] px-4 py-3 font-medium text-black dark:text-white">CREDIT</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(branchGroups).map((branch, branchIdx) => (
                <React.Fragment key={branchIdx}>
                  {/* Branch header row */}
                  <tr className="bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-200 dark:border-blue-800">
                    <td colSpan={4} className="px-4 py-3 font-bold text-lg text-blue-900 dark:text-blue-100">
                      {branch.branch_name} ({branch.branch_code})
                    </td>
                  </tr>

                  {/* Detail rows (indented) with alternating colors */}
                  {branch.details.map((detail, detailIdx) => (
                    <tr key={detailIdx} className={`border-b border-gray-200 dark:border-strokedark ${detailIdx % 2 === 0 ? 'bg-white dark:bg-boxdark' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                      <td className="border-b border-[#eee] px-4 py-3 pl-12 dark:border-strokedark">
                        {detail.description}
                      </td>
                      <td className="border-b text-center border-[#eee] px-4 py-3 dark:border-strokedark">
                        {detail.ccount}
                      </td>
                      <td className="border-b text-right border-[#eee] px-4 py-3 dark:border-strokedark">
                        ₱ {formatNumberComma(parseFloat(detail.debit))}
                      </td>
                      <td className="border-b text-right border-[#eee] px-4 py-3 dark:border-strokedark">
                        ₱ {formatNumberComma(parseFloat(detail.credit))}
                      </td>
                    </tr>
                  ))}

                  {/* Branch subtotal row */}
                  <tr className="bg-blue-100 dark:bg-blue-800/30 font-bold">
                    <td className="border-b border-[#eee] px-4 py-3 dark:border-strokedark">
                      Branch Subtotal
                    </td>
                    <td className="border-b border-[#eee] px-4 py-3 dark:border-strokedark"></td>
                    <td className="border-b text-right border-[#eee] px-4 py-3 dark:border-strokedark">
                      ₱ {formatNumberComma(branch.totalDebit)}
                    </td>
                    <td className="border-b text-right border-[#eee] px-4 py-3 dark:border-strokedark">
                      ₱ {formatNumberComma(branch.totalCredit)}
                    </td>
                  </tr>
                </React.Fragment>
              ))}

              {/* Grand total row */}
              <tr className="bg-yellow-500 text-strokedark font-bold text-lg">
                <td className="px-4 py-4">GRAND TOTAL</td>
                <td className="px-4 py-4"></td>
                <td className="text-right px-4 py-4">
                  ₱ {formatNumberComma(grandTotalDebit)}
                </td>
                <td className="text-right px-4 py-4">
                  ₱ {formatNumberComma(grandTotalCredit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummaryTicketByBranch;
