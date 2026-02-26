"use client";

import React from "react";
import { SubBranchBreakdown } from "@/types/dashboard";
import { formatCurrency } from "@/utils/formatCurrency";

interface SubBranchBreakdownTableProps {
  breakdown: SubBranchBreakdown[];
  loading?: boolean;
  fullWidth?: boolean;
  isOwner?: boolean;
}

/**
 * Loading skeleton for table.
 */
const LoadingSkeleton: React.FC = () => (
  <div>
    <div className="rounded-sm border border-stroke bg-white px-3 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-5 xl:pb-1">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4 dark:bg-gray-700"></div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-2 py-3">
            <div className="h-4 bg-gray-200 rounded flex-1 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-12 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-20 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-20 dark:bg-gray-700"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SubBranchBreakdownTable: React.FC<SubBranchBreakdownTableProps> = ({
  breakdown,
  loading,
  fullWidth = false,
  isOwner = true,
}) => {
  const containerClass = fullWidth ? "" : "col-span-12 xl:col-span-5";
  if (loading) {
    return (
      <div className={containerClass}>
        <LoadingSkeleton />
      </div>
    );
  }

  // Calculate totals (accumulate as numbers, format at display time)
  const totals = breakdown.reduce(
    (acc, item) => ({
      loan_count: acc.loan_count + item.loan_count,
      nr_balance: acc.nr_balance + parseFloat(item.nr_balance),
      udi_balance: acc.udi_balance + parseFloat(item.udi_balance),
      cash_out: acc.cash_out + parseFloat(item.cash_out || "0"),
    }),
    { loan_count: 0, nr_balance: 0, udi_balance: 0, cash_out: 0 }
  );

  if (breakdown.length === 0) {
    return (
      <div className={containerClass}>
        <div className="rounded-sm border border-stroke bg-white px-3 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-5 xl:pb-1">
          <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
            Sub-Branch Breakdown
          </h4>
          <div className="flex items-center justify-center py-10 text-gray-500">
            No data available for the selected period.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="rounded-sm border border-stroke bg-white px-3 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-5 xl:pb-1">
        <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
          Sub-Branch Breakdown
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="bg-gray-2 dark:bg-meta-4">
                <th className="p-2 text-left text-xs font-medium uppercase sm:p-3 sm:text-sm">
                  Sub-Branch
                </th>
                <th className="p-2 text-center text-xs font-medium uppercase sm:p-3 sm:text-sm w-16">
                  Loans
                </th>
                <th className="p-2 text-right text-xs font-medium uppercase sm:p-3 sm:text-sm whitespace-nowrap">
                  NR
                </th>
                <th className="p-2 text-right text-xs font-medium uppercase sm:p-3 sm:text-sm whitespace-nowrap">
                  {isOwner ? "UDI" : "Cash Out"}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Rows */}
              {breakdown.map((item, key) => (
                <tr
                  className={
                    key === breakdown.length - 1
                      ? ""
                      : "border-b border-stroke dark:border-strokedark"
                  }
                  key={item.branch_sub_id}
                >
                  <td className="p-2 sm:p-3">
                    <p className="text-black dark:text-white text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
                      {item.branch_sub_name}
                    </p>
                  </td>
                  <td className="p-2 text-center sm:p-3">
                    <p className="text-black dark:text-white text-xs sm:text-sm">
                      {item.loan_count}
                    </p>
                  </td>
                  <td className="p-2 text-right sm:p-3">
                    <p className="text-meta-3 text-xs sm:text-sm whitespace-nowrap">
                      {formatCurrency(item.nr_balance)}
                    </p>
                  </td>
                  <td className="p-2 text-right sm:p-3">
                    <p className="text-meta-5 text-xs sm:text-sm whitespace-nowrap">
                      {formatCurrency(isOwner ? item.udi_balance : item.cash_out)}
                    </p>
                  </td>
                </tr>
              ))}

              {/* Totals Row */}
              <tr className="bg-gray-2 dark:bg-meta-4">
                <td className="p-2 sm:p-3">
                  <p className="font-bold text-black dark:text-white text-xs sm:text-sm">
                    TOTAL
                  </p>
                </td>
                <td className="p-2 text-center sm:p-3">
                  <p className="font-bold text-black dark:text-white text-xs sm:text-sm">
                    {totals.loan_count}
                  </p>
                </td>
                <td className="p-2 text-right sm:p-3">
                  <p className="font-bold text-meta-3 text-xs sm:text-sm whitespace-nowrap">
                    {formatCurrency(totals.nr_balance)}
                  </p>
                </td>
                <td className="p-2 text-right sm:p-3">
                  <p className="font-bold text-meta-5 text-xs sm:text-sm whitespace-nowrap">
                    {formatCurrency(isOwner ? totals.udi_balance : totals.cash_out)}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubBranchBreakdownTable;
