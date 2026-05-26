"use client";

import React from 'react';
import { formatNumberComma, formatDateRange, toCamelCase } from '@/utils/helper';
import {
  BranchHierarchyItem,
  groupBreakdownByMainBranch,
} from '@/utils/groupBreakdownByMainBranch';

interface BranchBreakdownData extends BranchHierarchyItem {
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

const SummaryTicketByBranch: React.FC<BranchBreakdownProps> = ({ data, startDate, endDate }) => {
  const mainBranches = groupBreakdownByMainBranch(data, (item) => ({
    debit: parseFloat(item.debit || '0'),
    credit: parseFloat(item.credit || '0'),
  }));

  const grandTotalDebit  = mainBranches.reduce((s, m) => s + m.totals.debit,  0);
  const grandTotalCredit = mainBranches.reduce((s, m) => s + m.totals.credit, 0);

  return (
    <div className="mt-6">
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default bg-gray-200 dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="overflow-x-auto">
          <table className="w-full table-auto mb-4 min-w-[800px]">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th colSpan={4} className="text-center px-4 py-4 font-medium text-black dark:text-white">
                  <h2 className="text-xl mb-2">SUMMARY BY BRANCH &amp; SUB-BRANCH</h2>
                  <span className="text-sm font-normal">
                    {formatDateRange(startDate, endDate)}
                  </span>
                </th>
              </tr>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="min-w-[260px] px-4 py-3 font-medium text-black dark:text-white">BRANCH / SUB-BRANCH / TITLE</th>
                <th className="text-center min-w-[100px] px-4 py-3 font-medium text-black dark:text-white">COUNT</th>
                <th className="text-right min-w-[140px] px-4 py-3 font-medium text-black dark:text-white">DEBIT</th>
                <th className="text-right min-w-[140px] px-4 py-3 font-medium text-black dark:text-white">CREDIT</th>
              </tr>
            </thead>
            <tbody>
              {mainBranches.map((main) => (
                <React.Fragment key={main.main_branch_id ?? main.main_branch_name}>
                  {/* Main Branch header */}
                  <tr className="bg-indigo-100 dark:bg-indigo-900/30 border-t-4 border-indigo-300 dark:border-indigo-700">
                    <td colSpan={4} className="px-4 py-3 font-bold text-lg text-indigo-900 dark:text-indigo-100 uppercase tracking-wide">
                      {main.main_branch_name}
                    </td>
                  </tr>

                  {main.subBranches.map((sub) => (
                    <React.Fragment key={sub.branch_sub_id}>
                      {/* Sub-Branch header */}
                      <tr className="bg-blue-50 dark:bg-blue-900/20">
                        <td colSpan={4} className="px-4 py-2 pl-8 font-semibold text-base text-blue-900 dark:text-blue-100">
                          {sub.sub_branch_name}{sub.branch_code ? ` (${sub.branch_code})` : ''}
                        </td>
                      </tr>

                      {/* Detail rows */}
                      {sub.details.map((detail, detailIdx) => (
                        <tr key={detailIdx} className={`border-b border-gray-200 dark:border-strokedark ${detailIdx % 2 === 0 ? 'bg-white dark:bg-boxdark' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                          <td className="border-b border-[#eee] px-4 py-3 pl-16 dark:border-strokedark">
                            {detail.description?.toLowerCase() === 'cash in bank' ? 'Cash Out' : toCamelCase(detail.description)}
                          </td>
                          <td className="border-b text-center border-[#eee] px-4 py-3 dark:border-strokedark">
                            {detail.ccount}
                          </td>
                          <td className="border-b text-right border-[#eee] px-4 py-3 dark:border-strokedark">
                            {'₱'} {formatNumberComma(parseFloat(detail.debit))}
                          </td>
                          <td className="border-b text-right border-[#eee] px-4 py-3 dark:border-strokedark">
                            {'₱'} {formatNumberComma(parseFloat(detail.credit))}
                          </td>
                        </tr>
                      ))}

                      {/* Sub-Branch subtotal */}
                      <tr className="bg-blue-100 dark:bg-blue-800/30 font-semibold">
                        <td className="border-b border-[#eee] px-4 py-2 pl-8 dark:border-strokedark">
                          Sub-Branch Subtotal
                        </td>
                        <td className="border-b border-[#eee] px-4 py-2 dark:border-strokedark"></td>
                        <td className="border-b text-right border-[#eee] px-4 py-2 dark:border-strokedark">
                          {'₱'} {formatNumberComma(sub.totals.debit)}
                        </td>
                        <td className="border-b text-right border-[#eee] px-4 py-2 dark:border-strokedark">
                          {'₱'} {formatNumberComma(sub.totals.credit)}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}

                  {/* Main Branch subtotal */}
                  <tr className="bg-indigo-200 dark:bg-indigo-800/40 font-bold">
                    <td className="border-b border-[#eee] px-4 py-3 dark:border-strokedark uppercase tracking-wide">
                      {main.main_branch_name} Subtotal
                    </td>
                    <td className="border-b border-[#eee] px-4 py-3 dark:border-strokedark"></td>
                    <td className="border-b text-right border-[#eee] px-4 py-3 dark:border-strokedark">
                      {'₱'} {formatNumberComma(main.totals.debit)}
                    </td>
                    <td className="border-b text-right border-[#eee] px-4 py-3 dark:border-strokedark">
                      {'₱'} {formatNumberComma(main.totals.credit)}
                    </td>
                  </tr>
                </React.Fragment>
              ))}

              {/* Grand total row */}
              <tr className="bg-yellow-500 text-strokedark font-bold text-lg">
                <td className="px-4 py-4">GRAND TOTAL</td>
                <td className="px-4 py-4"></td>
                <td className="text-right px-4 py-4">
                  {'₱'} {formatNumberComma(grandTotalDebit)}
                </td>
                <td className="text-right px-4 py-4">
                  {'₱'} {formatNumberComma(grandTotalCredit)}
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
