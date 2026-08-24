'use client';

/**
 * Previewed amortization schedule.
 *
 * Rows come from buildSchedule() — dates generated locally, amounts split from
 * the server's own totals using saveLoanSchedule's rule. Column widths are left
 * to the browser (project standard: never fix table column widths).
 */

import React from 'react';
import { formatNumberComma } from '@/utils/helper';
import type { ScheduleRow } from '@/utils/loanQuote';

interface ScheduleTableProps {
  rows: ScheduleRow[];
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({ rows }) => {
  if (rows.length === 0) {
    return <p className="py-4 text-sm text-bodydark2">No schedule to show yet.</p>;
  }

  return (
    // A 60-month twice-a-month product yields 120+ rows; scroll on screen,
    // print in full (see styles.css .lc-schedule-scroll).
    <div className="lc-schedule-scroll max-h-96 overflow-y-auto overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-whiten text-left dark:bg-form-input">
          <tr>
            <th className="whitespace-nowrap px-3 py-2 font-medium text-body dark:text-bodydark">
              #
            </th>
            <th className="whitespace-nowrap px-3 py-2 font-medium text-body dark:text-bodydark">
              Due date
            </th>
            <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-body dark:text-bodydark">
              Interest
            </th>
            <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-body dark:text-bodydark">
              Amount due
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isLast = row.index === rows.length;
            return (
              <tr
                key={row.index}
                className={`border-t border-stroke dark:border-strokedark ${
                  isLast ? 'bg-whiten font-medium dark:bg-form-input' : ''
                }`}
              >
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-bodydark2">
                  {row.index}
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-black dark:text-white">
                  {row.dueDate}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-bodydark2">
                  {formatNumberComma(Number(row.interest))}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-black dark:text-white">
                  {formatNumberComma(Number(row.amount))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;
