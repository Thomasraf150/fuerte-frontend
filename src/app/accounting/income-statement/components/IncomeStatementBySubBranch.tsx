"use client";

import React, { useMemo } from 'react';
import moment from 'moment';
import Decimal from 'decimal.js';
import { IncomeStatementByBranchRow } from '@/hooks/useFinancialStatement';
import { formatAmount, DecimalValue } from '../utils/incomeStatementCalculations';
import { parseFinancialAmount } from '@/utils/financial';
import { rt, indent } from '@/components/ReportTable';

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

const SECTION_CONFIG: { key: SectionKey; label: string }[] = [
  { key: 'interestIncome', label: 'INTEREST INCOME' },
  { key: 'otherRevenues', label: 'OTHER REVENUES' },
  { key: 'lessExpense', label: 'LESS: EXPENSES' },
  { key: 'directFinancing', label: 'DIRECT FINANCING' },
  { key: 'otherIncomeExpense', label: 'OTHER INCOME / EXPENSE' },
  { key: 'incomeTax', label: 'INCOME TAX' },
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
        // Revenue sections (add)
        total = total.plus(branch.sections.interestIncome.monthlyTotals[month]);
        total = total.plus(branch.sections.otherRevenues.monthlyTotals[month]);
        // Expense sections (subtract)
        total = total.minus(branch.sections.lessExpense.monthlyTotals[month]);
        total = total.minus(branch.sections.directFinancing.monthlyTotals[month]);
        // Other income/expense (add - matches PDF formula)
        total = total.plus(branch.sections.otherIncomeExpense.monthlyTotals[month]);
        // Income tax (subtract)
        total = total.minus(branch.sections.incomeTax.monthlyTotals[month]);
        branch.totals.monthly[month] = total;
      });

      let varianceTotal = new Decimal(0);
      varianceTotal = varianceTotal.plus(branch.sections.interestIncome.varianceTotal);
      varianceTotal = varianceTotal.plus(branch.sections.otherRevenues.varianceTotal);
      varianceTotal = varianceTotal.minus(branch.sections.lessExpense.varianceTotal);
      varianceTotal = varianceTotal.minus(branch.sections.directFinancing.varianceTotal);
      varianceTotal = varianceTotal.plus(branch.sections.otherIncomeExpense.varianceTotal);
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
    <div className="space-y-10">
      {subBranchEntries.map(([branchId, branch]) => (
        <section key={branchId} aria-label={branch.branch_name}>
          {/* Sub-Branch Header */}
          <h3 className="mb-2 font-display text-lg font-semibold text-black dark:text-white">
            {branch.branch_name}
            {branch.branch_code && (
              <span className="ml-2 font-satoshi text-sm font-normal text-body dark:text-bodydark">
                ({branch.branch_code})
              </span>
            )}
          </h3>

          {/* Table for this sub-branch */}
          <div className={rt.wrap}>
            <table className={rt.table}>
              <thead className={rt.thead}>
                <tr>
                  <th className={`${rt.thPin} min-w-[280px]`}>Section / Account</th>
                  {monthKeys.map((month) => (
                    <th key={month} className={`${rt.thNum} min-w-[100px]`}>
                      {moment(month, 'YYYY-MM').format('MMM YY')}
                    </th>
                  ))}
                  <th className={`${rt.thNum} min-w-[100px]`}>Variance</th>
                </tr>
              </thead>

              <tbody>
                {SECTION_CONFIG.map((config) => {
                  const section = branch.sections[config.key];
                  if (section.rows.length === 0) return null;

                  return (
                    <React.Fragment key={config.key}>
                      {/* Section Header */}
                      <tr>
                        <td colSpan={monthKeys.length + 2} className={rt.groupPin}>
                          {config.label}
                        </td>
                      </tr>

                      {/* Account Rows */}
                      {section.rows.map((row, idx) => {
                        const isHeader = isHeaderRow(row);
                        return (
                          <tr
                            key={`${config.key}-${idx}`}
                            className={isHeader ? 'font-semibold' : 'hover:bg-whiten dark:hover:bg-meta-4'}
                          >
                            <td className={rt.tdPin} style={indent(isHeader ? 1 : 2)}>
                              {row.AccountName}
                            </td>
                            {monthKeys.map((month) => (
                              <td key={month} className={rt.tdNum}>
                                {isHeader ? '' : (row[month] ? formatAmount(parseAmount(row[month])) : '-')}
                              </td>
                            ))}
                            <td className={rt.tdNum}>
                              {isHeader ? '' : (row.variance ? formatAmount(parseAmount(row.variance)) : '-')}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Section Subtotal */}
                      <tr className={rt.subtotal}>
                        <td className={rt.tdPin}>Subtotal {config.label}</td>
                        {monthKeys.map((month) => (
                          <td key={month} className={rt.tdNum}>
                            {formatAmount(section.monthlyTotals[month])}
                          </td>
                        ))}
                        <td className={rt.tdNum}>{formatAmount(section.varianceTotal)}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}

                {/* Sub-Branch Total (Net Income) */}
                <tr className={rt.grand}>
                  <td className={rt.tdPin}>NET INCOME - {branch.branch_name}</td>
                  {monthKeys.map((month) => (
                    <td key={month} className={rt.tdNum}>
                      {formatAmount(branch.totals.monthly[month])}
                    </td>
                  ))}
                  <td className={rt.tdNum}>{formatAmount(branch.totals.variance)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* Grand Total - All Sub-Branches */}
      <div className={rt.wrap}>
        <table className={rt.table}>
          <tbody>
            <tr className={rt.grand}>
              <td className={`${rt.tdPin} min-w-[280px]`}>GRAND TOTAL - All Sub-Branches</td>
              {monthKeys.map((month) => (
                <td key={month} className={`${rt.tdNum} min-w-[100px]`}>
                  {formatAmount(grandTotals.monthly[month])}
                </td>
              ))}
              <td className={`${rt.tdNum} min-w-[100px]`}>{formatAmount(grandTotals.variance)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncomeStatementBySubBranch;