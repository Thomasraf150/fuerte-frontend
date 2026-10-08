"use client";

import React from 'react';
import moment from 'moment';
import { IncomeStatementRow } from '@/hooks/useFinancialStatement';
import { formatAmount, DecimalValue } from '../utils/incomeStatementCalculations';
import { parseFinancialAmount } from '@/utils/financial';
import { rt, indent } from '@/components/ReportTable';

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
}

interface SummaryRow {
  label: string;
  monthlyValues: Record<string, DecimalValue>;
  varianceValue: DecimalValue;
  /** 'grand' = the statement's bottom line (double rule under it); default is a single rule above. */
  emphasis?: 'subtotal' | 'grand';
}

/**
 * Reusable table component for income statement sections
 * Handles rendering of data rows, totals, and optional summary rows.
 * Styling follows the shared statement conventions in components/ReportTable.
 */
const IncomeStatementTable: React.FC<IncomeStatementTableProps> = ({
  data,
  monthKeys,
  monthlyTotals,
  varianceTotal,
  totalLabel,
  showHeader = false,
  summaryRows = [],
}) => {
  const parseAmount = (val: any): DecimalValue => parseFinancialAmount(val);

  // Check if a row is a header/category row (parent account with no direct transactions)
  // Header rows have acctnumber as null, undefined, empty string, or "0"
  const isHeaderRow = (row: IncomeStatementRow): boolean => {
    return !row.acctnumber || row.acctnumber === '0';
  };

  return (
    <table className={`${rt.table} mt-6 first:mt-0`}>
      {showHeader && (
        <thead className={rt.thead}>
          <tr>
            <th className={`${rt.thPin} min-w-[280px]`}>Account Name</th>
            {monthKeys.map((month: string) => (
              <th key={month} className={`${rt.thNum} min-w-[120px]`}>
                {moment(month, 'YYYY-MM').format('MMM YYYY')}
              </th>
            ))}
            <th className={`${rt.thNum} min-w-[100px]`}>Variance</th>
          </tr>
        </thead>
      )}
      {data && data.length > 0 ? (
        <>
          <tbody>
            {data.map((row: IncomeStatementRow, index: number) => {
              const isHeader = isHeaderRow(row);
              return (
                <tr key={index} className={isHeader ? '' : 'hover:bg-whiten dark:hover:bg-meta-4'}>
                  <td
                    className={`${rt.tdPin} md:min-w-[280px] lg:min-w-[400px] ${isHeader ? 'pt-4 font-semibold' : ''}`}
                    style={indent(isHeader ? 0 : 1)}
                  >
                    {row.AccountName}
                  </td>
                  {monthKeys.map((month) => (
                    <td key={month} className={`${rt.tdNum} min-w-[120px]`}>
                      {isHeader ? '' : (row[month] ? formatAmount(parseAmount(row[month])) : '-')}
                    </td>
                  ))}
                  <td className={`${rt.tdNum} min-w-[100px]`}>
                    {isHeader ? '' : (row.variance ? formatAmount(parseAmount(row.variance)) : '-')}
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            {/* Section total row: a single rule above */}
            <tr className={rt.subtotal}>
              <td className={rt.tdPin}>{totalLabel}</td>
              {monthKeys.map((month) => (
                <td key={month} className={rt.tdNum}>
                  {formatAmount(monthlyTotals[month])}
                </td>
              ))}
              <td className={rt.tdNum}>{formatAmount(varianceTotal)}</td>
            </tr>

            {/* Optional summary rows (like Total Income, Net Income, etc.) */}
            {summaryRows.map((summary, idx) => (
              <tr key={idx} className={summary.emphasis === 'grand' ? rt.grand : rt.subtotal}>
                <td className={rt.tdPin}>{summary.label}</td>
                {monthKeys.map((month) => (
                  <td key={month} className={rt.tdNum}>
                    {formatAmount(summary.monthlyValues[month])}
                  </td>
                ))}
                <td className={rt.tdNum}>{formatAmount(summary.varianceValue)}</td>
              </tr>
            ))}
          </tfoot>
        </>
      ) : (
        <tbody>
          <tr>
            <td colSpan={monthKeys.length + 2} className={rt.emptyRow}>
              No data available
            </td>
          </tr>
        </tbody>
      )}
    </table>
  );
};

export default IncomeStatementTable;
