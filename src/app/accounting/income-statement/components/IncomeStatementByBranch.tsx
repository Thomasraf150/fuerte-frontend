"use client";

import React, { useMemo } from 'react';
import moment from 'moment';
import Decimal from 'decimal.js';
import { IncomeStatementByBranchRow } from '@/hooks/useFinancialStatement';
import { formatAmount, DecimalValue } from '../utils/incomeStatementCalculations';
import { parseFinancialAmount } from '@/utils/financial';

interface BranchGroup {
  branch_name: string;
  branch_code: string | null;
  rows: IncomeStatementByBranchRow[];
  monthlyTotals: Record<string, DecimalValue>;
  varianceTotal: DecimalValue;
}

interface IncomeStatementByBranchProps {
  data: IncomeStatementByBranchRow[] | undefined;
  monthKeys: string[];
  sectionLabel: string;
  headerRowBgClass: string;
}

/**
 * Breakdown table component that groups income statement data by sub-branch.
 * Shows hierarchical view with branch headers and subtotals.
 */
const IncomeStatementByBranch: React.FC<IncomeStatementByBranchProps> = ({
  data,
  monthKeys,
  sectionLabel,
  headerRowBgClass,
}) => {
  const parseAmount = (val: any): DecimalValue => parseFinancialAmount(val);

  // Group data by branch_sub_id and calculate subtotals
  const branchGroups = useMemo(() => {
    if (!data || data.length === 0) return {};

    return data.reduce((acc, item) => {
      const branchKey = item.branch_sub_id;

      if (!acc[branchKey]) {
        acc[branchKey] = {
          branch_name: item.branch_name,
          branch_code: item.branch_code,
          rows: [],
          monthlyTotals: {} as Record<string, DecimalValue>,
          varianceTotal: new Decimal(0),
        };
        // Initialize monthly totals
        monthKeys.forEach((month) => {
          acc[branchKey].monthlyTotals[month] = new Decimal(0);
        });
      }

      acc[branchKey].rows.push(item);

      // Skip header rows (acctnumber is null/undefined/empty) for totals
      if (item.acctnumber && item.acctnumber !== '0') {
        // Calculate running totals per month
        monthKeys.forEach((month) => {
          const value = parseAmount(item[month]);
          acc[branchKey].monthlyTotals[month] = acc[branchKey].monthlyTotals[month].plus(value);
        });

        // Calculate variance total
        const varianceValue = parseAmount(item.variance);
        acc[branchKey].varianceTotal = acc[branchKey].varianceTotal.plus(varianceValue);
      }

      return acc;
    }, {} as Record<number, BranchGroup>);
  }, [data, monthKeys]);

  // Check if row is a header/category row
  const isHeaderRow = (row: IncomeStatementByBranchRow): boolean => {
    return !row.acctnumber || row.acctnumber === '0';
  };

  // Calculate grand totals across all branches
  const grandTotals = useMemo(() => {
    const monthly: Record<string, DecimalValue> = {};
    let variance: DecimalValue = new Decimal(0);

    monthKeys.forEach((month) => {
      monthly[month] = new Decimal(0);
    });

    Object.values(branchGroups).forEach((group) => {
      monthKeys.forEach((month) => {
        monthly[month] = monthly[month].plus(group.monthlyTotals[month] || new Decimal(0));
      });
      variance = variance.plus(group.varianceTotal);
    });

    return { monthly, variance };
  }, [branchGroups, monthKeys]);

  if (!data || data.length === 0) return null;

  const branchEntries = Object.entries(branchGroups);
  if (branchEntries.length === 0) return null;

  return (
    <div className="mt-8 mb-8 border border-stroke dark:border-strokedark rounded-sm shadow-md">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-b-2 border-blue-200 dark:border-blue-700">
        <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100">
          {sectionLabel} - Sub-Branch Breakdown
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          Detailed breakdown showing individual sub-branch contributions
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Header */}
          <thead className="sticky top-0 z-1">
            <tr className="bg-gray-2 dark:bg-meta-4">
              <th className="px-4 py-3 font-medium text-black dark:text-white text-left min-w-[280px]">
                Branch / Account
              </th>
              {monthKeys.map((month: string) => (
                <th
                  key={month}
                  className="px-4 py-3 font-medium text-black dark:text-white text-right min-w-[100px]"
                >
                  {moment(month, 'YYYY-MM').format('MMM YY')}
                </th>
              ))}
              <th className="px-4 py-3 font-medium text-black dark:text-white text-right min-w-[100px]">
                Variance
              </th>
            </tr>
          </thead>

          <tbody>
            {branchEntries.map(([branchId, group]) => (
              <React.Fragment key={branchId}>
                {/* Branch header row */}
                <tr className={`${headerRowBgClass}`}>
                  <td
                    colSpan={monthKeys.length + 2}
                    className="px-6 py-4 font-bold text-blue-900 dark:text-blue-100 text-base"
                  >
                    {group.branch_name}
                    {group.branch_code && (
                      <span className="ml-2 text-sm font-normal text-blue-700 dark:text-blue-300">
                        ({group.branch_code})
                      </span>
                    )}
                  </td>
                </tr>

                {/* Account rows for this branch */}
                {group.rows.map((row, idx) => {
                  const isHeader = isHeaderRow(row);
                  return (
                    <tr
                      key={`${branchId}-${idx}`}
                      className={isHeader
                        ? 'bg-gray-100 dark:bg-gray-800/50 font-medium'
                        : `border-b border-[#eee] dark:border-strokedark hover:bg-blue-50 dark:hover:bg-meta-4 ${
                            idx % 2 === 0 ? 'bg-white dark:bg-boxdark' : 'bg-gray-50 dark:bg-gray-900/30'
                          }`
                      }
                    >
                      <td className={`py-2 text-black dark:text-white ${
                        isHeader ? 'pl-8 pr-4' : 'pl-12 pr-4'
                      }`}>
                        {row.AccountName}
                      </td>
                      {monthKeys.map((month) => (
                        <td
                          key={month}
                          className="px-4 py-2 text-right text-black dark:text-white"
                        >
                          {isHeader ? '' : (row[month] ? formatAmount(parseAmount(row[month])) : '-')}
                        </td>
                      ))}
                      <td className="px-4 py-2 text-right text-black dark:text-white">
                        {isHeader ? '' : (row.variance ? formatAmount(parseAmount(row.variance)) : '-')}
                      </td>
                    </tr>
                  );
                })}

                {/* Branch subtotal row */}
                <tr className="bg-gray-100 dark:bg-gray-700/50 border-b-2 border-stroke dark:border-strokedark">
                  <td className="px-4 py-2 font-semibold text-black dark:text-white">
                    Subtotal - {group.branch_name}
                  </td>
                  {monthKeys.map((month) => (
                    <td
                      key={month}
                      className="px-4 py-2 font-semibold text-right text-black dark:text-white"
                    >
                      {formatAmount(group.monthlyTotals[month])}
                    </td>
                  ))}
                  <td className="px-4 py-2 font-semibold text-right text-black dark:text-white">
                    {formatAmount(group.varianceTotal)}
                  </td>
                </tr>
              </React.Fragment>
            ))}

            {/* Grand Total Row - All Branches Combined */}
            <tr className="bg-yellow-100 dark:bg-yellow-900/30 border-t-4 border-yellow-400">
              <td className="px-6 py-4 font-bold text-yellow-900 dark:text-yellow-100 text-base">
                GRAND TOTAL - All Sub-Branches
              </td>
              {monthKeys.map((month) => (
                <td
                  key={month}
                  className="px-4 py-4 font-bold text-right text-yellow-900 dark:text-yellow-100"
                >
                  {formatAmount(grandTotals.monthly[month])}
                </td>
              ))}
              <td className="px-4 py-4 font-bold text-right text-yellow-900 dark:text-yellow-100">
                {formatAmount(grandTotals.variance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncomeStatementByBranch;
