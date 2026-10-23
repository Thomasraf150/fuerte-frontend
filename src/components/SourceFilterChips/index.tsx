"use client";

import React from "react";
import type { BorrowerSourceFilter } from "@/utils/DataTypes";

interface SourceFilterChipsProps {
  value: BorrowerSourceFilter;
  onChange: (value: BorrowerSourceFilter) => void;
}

// Where the borrower came from (Rafael 2026-10-23): made from an application -- Marketing's
// applicant, through Call Center -- or created directly. The Payer filter's chips, so the two rows
// read as one control set.
const OPTIONS: { value: BorrowerSourceFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'APPLICATION', label: 'From application' },
  { value: 'DIRECT', label: 'Created directly' },
];

const SourceFilterChips: React.FC<SourceFilterChipsProps> = ({ value, onChange }) => (
  <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-4" role="group" aria-label="Filter by source">
    <span className="mr-1 hidden text-sm font-medium text-body dark:text-bodydark1 sm:inline">Source:</span>
    {OPTIONS.map((option) => {
      const selected = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={selected}
          onClick={() => onChange(option.value)}
          // The same 48px tap target trick as PayerFilterChips.
          className={`relative inline-flex min-w-12 items-center justify-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors after:absolute after:inset-x-0 after:-inset-y-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 sm:px-4 sm:py-2 sm:text-sm ${
            selected
              ? 'border-primary bg-primary/10 text-primary ring-1 ring-inset ring-primary dark:bg-primary/20'
              : 'border-stroke bg-white text-body hover:border-primary/50 dark:border-strokedark dark:bg-boxdark dark:text-bodydark1'
          }`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

export default SourceFilterChips;
