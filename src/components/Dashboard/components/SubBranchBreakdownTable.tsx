"use client";

import React from "react";
import { SubBranchBreakdown } from "@/types/dashboard";

interface SubBranchBreakdownTableProps {
  breakdown: SubBranchBreakdown[];
  loading?: boolean;
}

/**
 * Format number as Philippine Peso currency.
 */
const formatCurrency = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return "₱0.00";

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Loading skeleton for table.
 */
const LoadingSkeleton: React.FC = () => (
  <div className="col-span-12 xl:col-span-4">
    <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4 dark:bg-gray-700"></div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 py-3">
            <div className="h-4 bg-gray-200 rounded flex-1 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-16 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-24 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-24 dark:bg-gray-700"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SubBranchBreakdownTable: React.FC<SubBranchBreakdownTableProps> = ({
  breakdown,
  loading,
}) => {
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Calculate totals
  const totals = breakdown.reduce(
    (acc, item) => ({
      loan_count: acc.loan_count + item.loan_count,
      nr_balance: (parseFloat(acc.nr_balance) + parseFloat(item.nr_balance)).toFixed(2),
      udi_balance: (parseFloat(acc.udi_balance) + parseFloat(item.udi_balance)).toFixed(2),
    }),
    { loan_count: 0, nr_balance: "0", udi_balance: "0" }
  );

  if (breakdown.length === 0) {
    return (
      <div className="col-span-12 xl:col-span-4">
        <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
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
    <div className="col-span-12 xl:col-span-4">
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
          Sub-Branch Breakdown
        </h4>

        <div className="flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-4 rounded-sm bg-gray-2 dark:bg-meta-4">
            <div className="p-2.5 xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Sub-Branch
              </h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Loans
              </h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                NR
              </h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                UDI
              </h5>
            </div>
          </div>

          {/* Rows */}
          {breakdown.map((item, key) => (
            <div
              className={`grid grid-cols-4 ${
                key === breakdown.length - 1
                  ? ""
                  : "border-b border-stroke dark:border-strokedark"
              }`}
              key={item.branch_sub_id}
            >
              <div className="flex items-center gap-3 p-2.5 xl:p-5">
                <p className="text-black dark:text-white text-sm">
                  {item.branch_sub_name}
                </p>
              </div>

              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="text-black dark:text-white">{item.loan_count}</p>
              </div>

              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="text-meta-3 text-sm">
                  {formatCurrency(item.nr_balance)}
                </p>
              </div>

              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="text-meta-5 text-sm">
                  {formatCurrency(item.udi_balance)}
                </p>
              </div>
            </div>
          ))}

          {/* Totals Row */}
          <div className="grid grid-cols-4 rounded-sm bg-gray-2 dark:bg-meta-4">
            <div className="p-2.5 xl:p-5">
              <p className="font-bold text-black dark:text-white">TOTAL</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="font-bold text-black dark:text-white">
                {totals.loan_count}
              </p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="font-bold text-meta-3 text-sm">
                {formatCurrency(totals.nr_balance)}
              </p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="font-bold text-meta-5 text-sm">
                {formatCurrency(totals.udi_balance)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubBranchBreakdownTable;
