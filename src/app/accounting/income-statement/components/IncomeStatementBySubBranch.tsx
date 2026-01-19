"use client";

import React, { useMemo } from 'react';
import moment from 'moment';
import Decimal from 'decimal.js';
import { IncomeStatementByBranchRow } from '@/hooks/useFinancialStatement';
import { formatAmount, DecimalValue } from '../utils/incomeStatementCalculations';
import { parseFinancialAmount } from '@/utils/financial';

interface SectionData {
  rows: IncomeStatementByBranchRow[];
  monthlyTotals: Record<string, DecimalValue>;
  varianceTotal: DecimalValue;
}

interface SubBranchData {
  branch_name: string;
  branch_code: string | null;
  sections: {
    interestIncome: SectionData;
    otherRevenues: SectionData;
    directFinancing: SectionData;
    lessExpense: SectionData;
    otherIncomeExpense: SectionData;
    incomeTax: SectionData;
  };
  totals: {
    monthly: Record<string, DecimalValue>;
    variance: DecimalValue;
  };
}

interface IncomeStatementBySubBranchProps {
  interestIncome: IncomeStatementByBranchRow[];
  otherRevenues: IncomeStatementByBranchRow[];
  directFinancing: IncomeStatementByBranchRow[];
  lessExpense: IncomeStatementByBranchRow[];
  otherIncomeExpense: IncomeStatementByBranchRow[];
  incomeTax: IncomeStatementByBranchRow[];
  monthKeys: string[];
}

type SectionKey = 'interestIncome' | 'otherRevenues' | 'directFinancing' | 'lessExpense' | 'otherIncomeExpense' | 'incomeTax';

const SECTION_CONFIG: { key: SectionKey; label: string; bgClass: string; textClass: string }[] = [
  { key: 'interestIncome', label: 'INTEREST INCOME', bgClass: 'bg-blue-50 dark:bg-blue-900/30', textClass: 'text-blue-800 dark:text-blue-200' },
  { key: 'otherRevenues', label: 'OTHER REVENUES', bgClass: 'bg-blue-50 dark:bg-blue-900/30', textClass: 'text-blue-800 dark:text-blue-200' },
  { key: 'lessExpense', label: 'LESS: EXPENSES', bgClass: 'bg-red-50 dark:bg-red-900/30', textClass: 'text-red-800 dark:text-red-200' },
  { key: 'directFinancing', label: 'DIRECT FINANCING', bgClass: 'bg-orange-50 dark:bg-orange-900/30', textClass: 'text-orange-800 dark:text-orange-200' },
  { key: 'otherIncomeExpense', label: 'OTHER INCOME / EXPENSE', bgClass: 'bg-purple-50 dark:bg-purple-900/30', textClass: 'text-purple-800 dark:text-purple-200' },
  { key: 'incomeTax', label: 'INCOME TAX', bgClass: 'bg-green-50 dark:bg-green-900/30', textClass: 'text-green-800 dark:text-green-200' },
];

const IncomeStatementBySubBranch: React.FC<IncomeStatementBySubBranchProps> = ({
  interestIncome,
  otherRevenues,
  directFinancing,
  lessExpense,
  otherIncomeExpense,
  incomeTax,
  monthKeys,
}) => {
  const parseAmount = (val: string | number | null | undefined): DecimalValue => parseFinancialAmount(val);

  const isHeaderRow = (row: IncomeStatementByBranchRow): boolean => {
    return !row.acctnumber || row.acctnumber === '0';
  };

  const createEmptySection = (): SectionData => ({
    rows: [],
    monthlyTotals: monthKeys.reduce((acc, m) => ({ ...acc, [m]: new Decimal(0) }), {}),
    varianceTotal: new Decimal(0),
  });

  // Merge all section data by branch_sub_id
  const subBranchMap = useMemo(() => {
    const map = new Map<number, SubBranchData>();

    const addToMap = (rows: IncomeStatementByBranchRow[], sectionKey: SectionKey) => {
      rows.forEach((row) => {
        if (!map.has(row.branch_sub_id)) {
          map.set(row.branch_sub_id, {
            branch_name: row.branch_name,
            branch_code: row.branch_code,
            sections: {
              interestIncome: createEmptySection(),
              otherRevenues: createEmptySection(),
              directFinancing: createEmptySection(),
              lessExpense: createEmptySection(),
              otherIncomeExpense: createEmptySection(),
              incomeTax: createEmptySection(),
            },
            totals: {
              monthly: monthKeys.reduce((acc, m) => ({ ...acc, [m]: new Decimal(0) }), {}),
              variance: new Decimal(0),
            },
          });
        }

        const branch = map.get(row.branch_sub_id)!;
        branch.sections[sectionKey].rows.push(row);

        // Calculate totals (skip header rows)
        if (row.acctnumber && row.acctnumber !== '0') {
          monthKeys.forEach((month) => {
            const value = parseAmount(row[month]);
            branch.sections[sectionKey].monthlyTotals[month] =
              branch.sections[sectionKey].monthlyTotals[month].plus(value);
          });
          const varianceValue = parseAmount(row.variance);
          branch.sections[sectionKey].varianceTotal =
            branch.sections[sectionKey].varianceTotal.plus(varianceValue);
        }
      });
    };

    addToMap(interestIncome, 'interestIncome');
    addToMap(otherRevenues, 'otherRevenues');
    addToMap(directFinancing, 'directFinancing');
    addToMap(lessExpense, 'lessExpense');
    addToMap(otherIncomeExpense, 'otherIncomeExpense');
    addToMap(incomeTax, 'incomeTax');

    // Calculate sub-branch totals (sum of all sections)
    map.forEach((branch) => {
      monthKeys.forEach((month) => {
        let total = new Decimal(0);
        // Income sections (add)
        total = total.plus(branch.sections.interestIncome.monthlyTotals[month]);
        total = total.plus(branch.sections.otherRevenues.monthlyTotals[month]);
        total = total.plus(branch.sections.directFinancing.monthlyTotals[month]);
        // Expense sections (subtract)
        total = total.minus(branch.sections.lessExpense.monthlyTotals[month]);
        total = total.minus(branch.sections.otherIncomeExpense.monthlyTotals[month]);
        total = total.minus(branch.sections.incomeTax.monthlyTotals[month]);
        branch.totals.monthly[month] = total;
      });

      let varianceTotal = new Decimal(0);
      varianceTotal = varianceTotal.plus(branch.sections.interestIncome.varianceTotal);
      varianceTotal = varianceTotal.plus(branch.sections.otherRevenues.varianceTotal);
      varianceTotal = varianceTotal.plus(branch.sections.directFinancing.varianceTotal);
      varianceTotal = varianceTotal.minus(branch.sections.lessExpense.varianceTotal);
      varianceTotal = varianceTotal.minus(branch.sections.otherIncomeExpense.varianceTotal);
      varianceTotal = varianceTotal.minus(branch.sections.incomeTax.varianceTotal);
      branch.totals.variance = varianceTotal;
    });

    return map;
  }, [interestIncome, otherRevenues, directFinancing, lessExpense, otherIncomeExpense, incomeTax, monthKeys]);

  // Calculate grand totals across all sub-branches
  const grandTotals = useMemo(() => {
    const monthly: Record<string, DecimalValue> = monthKeys.reduce(
      (acc, m) => ({ ...acc, [m]: new Decimal(0) }), {}
    );
    let variance: DecimalValue = new Decimal(0);

    subBranchMap.forEach((branch) => {
      monthKeys.forEach((month) => {
        monthly[month] = monthly[month].plus(branch.totals.monthly[month]);
      });
      variance = variance.plus(branch.totals.variance);
    });

    return { monthly, variance };
  }, [subBranchMap, monthKeys]);

  const hasData = subBranchMap.size > 0;
  if (!hasData) return null;

  const subBranchEntries = Array.from(subBranchMap.entries());

  return (
    <div className="space-y-8">
      {subBranchEntries.map(([branchId, branch]) => (
        <div
          key={branchId}
          className="border border-stroke dark:border-strokedark rounded-lg shadow-md overflow-hidden"
        >
          {/* Sub-Branch Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-700 dark:to-indigo-900">
            <h3 className="text-lg font-bold text-white">
              {branch.branch_name}
              {branch.branch_code && (
                <span className="ml-2 text-sm font-normal text-indigo-200">
                  ({branch.branch_code})
                </span>
              )}
            </h3>
          </div>

          {/* Table for this sub-branch */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-1">
                <tr className="bg-gray-2 dark:bg-meta-4">
                  <th className="px-4 py-3 font-medium text-black dark:text-white text-left min-w-[280px]">
                    Section / Account
                  </th>
                  {monthKeys.map((month) => (
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
                {SECTION_CONFIG.map((config) => {
                  const section = branch.sections[config.key];
                  if (section.rows.length === 0) return null;

                  return (
                    <React.Fragment key={config.key}>
                      {/* Section Header */}
                      <tr className={config.bgClass}>
                        <td
                          colSpan={monthKeys.length + 2}
                          className={`px-4 py-3 font-bold ${config.textClass}`}
                        >
                          {config.label}
                        </td>
                      </tr>

                      {/* Account Rows */}
                      {section.rows.map((row, idx) => {
                        const isHeader = isHeaderRow(row);
                        return (
                          <tr
                            key={`${config.key}-${idx}`}
                            className={isHeader
                              ? 'bg-gray-100 dark:bg-gray-800/50 font-medium'
                              : `border-b border-[#eee] dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 ${
                                  idx % 2 === 0 ? 'bg-white dark:bg-boxdark' : 'bg-gray-50 dark:bg-gray-900/30'
                                }`
                            }
                          >
                            <td className={`py-2 text-black dark:text-white ${
                              isHeader ? 'pl-6 pr-4' : 'pl-10 pr-4'
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

                      {/* Section Subtotal */}
                      <tr className="bg-gray-100 dark:bg-gray-700/50 border-b border-stroke dark:border-strokedark">
                        <td className="px-4 py-2 font-semibold text-black dark:text-white text-sm">
                          Subtotal {config.label}
                        </td>
                        {monthKeys.map((month) => (
                          <td
                            key={month}
                            className="px-4 py-2 font-semibold text-right text-black dark:text-white"
                          >
                            {formatAmount(section.monthlyTotals[month])}
                          </td>
                        ))}
                        <td className="px-4 py-2 font-semibold text-right text-black dark:text-white">
                          {formatAmount(section.varianceTotal)}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}

                {/* Sub-Branch Total (Net Income) */}
                <tr className="bg-indigo-100 dark:bg-indigo-900/50 border-t-2 border-indigo-400">
                  <td className="px-4 py-3 font-bold text-indigo-900 dark:text-indigo-100">
                    NET INCOME - {branch.branch_name}
                  </td>
                  {monthKeys.map((month) => (
                    <td
                      key={month}
                      className="px-4 py-3 font-bold text-right text-indigo-900 dark:text-indigo-100"
                    >
                      {formatAmount(branch.totals.monthly[month])}
                    </td>
                  ))}
                  <td className="px-4 py-3 font-bold text-right text-indigo-900 dark:text-indigo-100">
                    {formatAmount(branch.totals.variance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Grand Total - All Sub-Branches */}
      <div className="border border-stroke dark:border-strokedark rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <tr className="bg-yellow-100 dark:bg-yellow-900/30 border-t-4 border-yellow-400">
                <td className="px-6 py-4 font-bold text-yellow-900 dark:text-yellow-100 text-base min-w-[280px]">
                  GRAND TOTAL - All Sub-Branches
                </td>
                {monthKeys.map((month) => (
                  <td
                    key={month}
                    className="px-4 py-4 font-bold text-right text-yellow-900 dark:text-yellow-100 min-w-[100px]"
                  >
                    {formatAmount(grandTotals.monthly[month])}
                  </td>
                ))}
                <td className="px-4 py-4 font-bold text-right text-yellow-900 dark:text-yellow-100 min-w-[100px]">
                  {formatAmount(grandTotals.variance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IncomeStatementBySubBranch;
