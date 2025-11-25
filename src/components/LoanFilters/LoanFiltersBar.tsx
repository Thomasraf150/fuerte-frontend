"use client";

import React from "react";
import MonthYearFilter from "./MonthYearFilter";
import BranchFilter from "./BranchFilter";

interface LoanFiltersBarProps {
  month: number | null;
  year: number | null;
  branchSubId: number | null;
  onMonthChange: (month: number | null) => void;
  onYearChange: (year: number | null) => void;
  onBranchSubIdChange: (branchSubId: number | null) => void;
  onClearFilters: () => void;
}

const LoanFiltersBar: React.FC<LoanFiltersBarProps> = ({
  month,
  year,
  branchSubId,
  onMonthChange,
  onYearChange,
  onBranchSubIdChange,
  onClearFilters,
}) => {
  // TEMPORARY: Debug logging (REMOVE BEFORE PRODUCTION)
  console.log('[LoanFiltersBar] Rendering with filters:', {
    month,
    year,
    branchSubId,
  });

  const hasActiveFilters = month !== null || year !== null || branchSubId !== null;

  const handleClear = () => {
    console.log('[LoanFiltersBar] Clear filters clicked');
    onClearFilters();
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
      <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">
          Filter Loans
        </h3>
      </div>
      <div className="p-7">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Month and Year Filters */}
          <div className="md:col-span-2">
            <MonthYearFilter
              month={month}
              year={year}
              onMonthChange={onMonthChange}
              onYearChange={onYearChange}
            />
          </div>

          {/* Branch Filter */}
          <div>
            <BranchFilter
              branchSubId={branchSubId}
              onBranchSubIdChange={onBranchSubIdChange}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              onClick={handleClear}
              className="inline-flex items-center justify-center rounded-md bg-meta-1 px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90 transition"
            >
              <svg
                className="mr-2"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Clear Filters
            </button>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-body dark:text-bodydark">
              Active filters:
            </span>
            {month && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary bg-opacity-10 px-3 py-1 text-sm font-medium text-primary">
                Month: {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
              </span>
            )}
            {year && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary bg-opacity-10 px-3 py-1 text-sm font-medium text-primary">
                Year: {year}
              </span>
            )}
            {branchSubId && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary bg-opacity-10 px-3 py-1 text-sm font-medium text-primary">
                Branch: {branchSubId}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanFiltersBar;
