"use client";

import React from 'react';
import moment from 'moment';
import { IncomeStatementRow } from '@/hooks/useFinancialStatement';
import { formatAmount, DecimalValue } from '../utils/incomeStatementCalculations';
import { parseFinancialAmount } from '@/utils/financial';

interface IncomeStatementTableProps {
  data: IncomeStatementRow[] | undefined;
  monthKeys: string[];
  monthlyTotals: Record<string, DecimalValue>;
  varianceTotal: DecimalValue;
  /** Label for the section total row */
  totalLabel: string;
  /** Show header row with month columns (only needed for first table) */
  showHeader?: boolean;
  /** Optional summary rows to show after section total */
  summaryRows?: SummaryRow[];
  /** Custom background class for the section total row (default: gray) */
  totalRowBgClass?: string;
  /** Custom text class for the section total row */
  totalRowTextClass?: string;
  /** Custom background/border class for header/category rows (rows where acctnumber is null) */
  headerRowBgClass?: string;
}

interface SummaryRow {
  label: string;
  monthlyValues: Record<string, DecimalValue>;
  varianceValue: DecimalValue;
  /** CSS class for background color */
  bgClass: string;
  /** CSS class for text color */
  textClass?: string;
}

/**
 * Reusable table component for income statement sections
 * Handles rendering of data rows, totals, and optional summary rows
 */
const IncomeStatementTable: React.FC<IncomeStatementTableProps> = ({
  data,
  monthKeys,
  monthlyTotals,
  varianceTotal,
  totalLabel,
  showHeader = false,
  summaryRows = [],
  totalRowBgClass = 'bg-gray-2 dark:bg-meta-4',
  totalRowTextClass = 'text-black dark:text-white',
  headerRowBgClass = 'bg-gray-100 dark:bg-gray-700',
}) => {
  const parseAmount = (val: any): DecimalValue => parseFinancialAmount(val);

  // Check if a row is a header/category row (parent account with no direct transactions)
  // Header rows have acctnumber as null, undefined, empty string, or "0"
  const isHeaderRow = (row: IncomeStatementRow): boolean => {
    return !row.acctnumber || row.acctnumber === '0';
  };

  return (
    <table className="w-full text-sm mt-6 first:mt-0">
      {showHeader && (
        <thead className="sticky top-0 z-1">
          <tr className="bg-gray-2 dark:bg-meta-4">
            <th className="px-4 py-4 font-medium text-black dark:text-white text-left min-w-[280px]">
              Account Name
            </th>
            {monthKeys.map((month: string) => (
              <th
                key={month}
                className="px-4 py-4 font-medium text-black dark:text-white text-right min-w-[120px]"
              >
                {moment(month, 'YYYY-MM').format('MMM YYYY')}
              </th>
            ))}
            <th className="px-4 py-4 font-medium text-black dark:text-white text-right min-w-[100px]">
              Variance
            </th>
          </tr>
        </thead>
      )}
      {data && data.length > 0 ? (
        <>
          <tbody>
            {data.map((row: IncomeStatementRow, index: number) => {
              const isHeader = isHeaderRow(row);
              return (
                <tr
                  key={index}
                  className={isHeader
                    ? `${headerRowBgClass} font-semibold border-l-4`
                    : 'border-b border-[#eee] dark:border-strokedark hover:bg-gray-2 dark:hover:bg-meta-4'
                  }
                >
                  <td className={`py-4 text-black dark:text-white md:min-w-[280px] lg:min-w-[400px] ${
                    isHeader ? 'px-4' : 'pl-8 pr-4'
                  }`}>
                    {row.AccountName}
                  </td>
                  {monthKeys.map((month) => (
                    <td
                      key={month}
                      className="px-4 py-4 text-right text-black dark:text-white min-w-[120px]"
                    >
                      {isHeader ? '' : (row[month] ? formatAmount(parseAmount(row[month])) : '-')}
                    </td>
                  ))}
                  <td className="px-4 py-4 text-right text-black dark:text-white min-w-[100px]">
                    {isHeader ? '' : (row.variance ? formatAmount(parseAmount(row.variance)) : '-')}
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            {/* Section total row */}
            <tr className={totalRowBgClass}>
              <td className={`px-4 py-4 font-bold ${totalRowTextClass}`}>
                {totalLabel}
              </td>
              {monthKeys.map((month) => (
                <td
                  key={month}
                  className={`px-4 py-4 font-bold text-right ${totalRowTextClass}`}
                >
                  {formatAmount(monthlyTotals[month])}
                </td>
              ))}
              <td className={`px-4 py-4 font-bold text-right ${totalRowTextClass}`}>
                {formatAmount(varianceTotal)}
              </td>
            </tr>

            {/* Optional summary rows (like Total Income, Net Income, etc.) */}
            {summaryRows.map((summary, idx) => (
              <tr key={idx} className={summary.bgClass}>
                <td className={`px-4 py-4 font-bold ${summary.textClass || 'text-white'}`}>
                  {summary.label}
                </td>
                {monthKeys.map((month) => (
                  <td
                    key={month}
                    className={`px-4 py-4 font-bold text-right ${summary.textClass || 'text-white'}`}
                  >
                    {formatAmount(summary.monthlyValues[month])}
                  </td>
                ))}
                <td className={`px-4 py-4 font-bold text-right ${summary.textClass || 'text-white'}`}>
                  {formatAmount(summary.varianceValue)}
                </td>
              </tr>
            ))}
          </tfoot>
        </>
      ) : (
        <tbody>
          <tr>
            <td
              colSpan={monthKeys.length + 2}
              className="px-4 py-8 text-center text-black dark:text-white"
            >
              No data available
            </td>
          </tr>
        </tbody>
      )}
    </table>
  );
};

export default IncomeStatementTable;
