"use client";

import React from "react";
import { formatCount } from "@/utils/helper";

interface Props {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
}

/**
 * Pager for the phone card list.
 *
 * CustomDatatable ships its own pager, but it lays the record count, the page
 * size selector and up to seven numbered page buttons out in a single
 * `justify-between` row, which overflows a 360px screen. That component is
 * shared by every list page in the app, so rather than change it here the card
 * list — which replaces the table below `md` anyway — gets this two-button
 * pager instead. Both buttons clear the 48px minimum tap target.
 */
const ProblemAccountsPager: React.FC<Props> = ({
  currentPage,
  totalPages,
  totalRecords,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const btn =
    "min-h-[48px] min-w-[48px] flex-1 rounded border border-stroke px-4 text-sm font-medium text-black transition-colors disabled:opacity-40 dark:border-strokedark dark:text-white";

  return (
    <nav
      aria-label="Problem accounts pages"
      className="mt-4 flex items-center gap-3 border-t border-stroke pt-4 dark:border-strokedark"
    >
      <button
        type="button"
        className={btn}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Previous
      </button>
      <p className="shrink-0 text-center text-xs text-body dark:text-bodydark">
        Page {formatCount(currentPage)} of {formatCount(totalPages)}
        <br />
        {formatCount(totalRecords)} accounts
      </p>
      <button
        type="button"
        className={btn}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
      </button>
    </nav>
  );
};

export default ProblemAccountsPager;
