"use client";

import React from "react";
import type { PayerFilter } from "@/utils/DataTypes";

interface PayerFilterChipsProps {
  value: PayerFilter;
  onChange: (value: PayerFilter) => void;
}

// Same rounded chips as the Loans list's status filter, so the interaction is
// familiar. Each standing chip carries a small square in its pill's tone, so it
// reads as "show me these stamps"; All has none. Tokens only — the red-* and
// gray-* shades are dead in this Tailwind config.
const OPTIONS: { value: PayerFilter; label: string; swatch: string | null }[] = [
  { value: 'all', label: 'All', swatch: null },
  { value: 'GOOD', label: 'Good', swatch: 'border border-green-700/60 bg-green-700/15 dark:border-meta-3/70' },
  { value: 'PROBLEM', label: 'Problem', swatch: 'bg-danger' },
  { value: 'NONE', label: 'None', swatch: 'border border-body/50 dark:border-bodydark/60' },
];

const PayerFilterChips: React.FC<PayerFilterChipsProps> = ({ value, onChange }) => (
  <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-4" role="group" aria-label="Filter by payer">
    <span className="mr-1 hidden text-sm font-medium text-body dark:text-bodydark1 sm:inline">Payer:</span>
    {OPTIONS.map((option) => {
      const selected = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={selected}
          onClick={() => onChange(option.value)}
          // min-w-12 + the ::after give every chip a 48px tap target on phones
          // without changing its look; gap-y-4 keeps wrapped rows' targets apart.
          className={`relative inline-flex min-w-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors after:absolute after:inset-x-0 after:-inset-y-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 sm:px-4 sm:py-2 sm:text-sm ${
            selected
              ? 'border-primary bg-primary/10 text-primary ring-1 ring-inset ring-primary dark:bg-primary/20'
              : 'border-stroke bg-white text-body hover:border-primary/50 dark:border-strokedark dark:bg-boxdark dark:text-bodydark1'
          }`}
        >
          {option.swatch && <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-[2px] ${option.swatch}`} />}
          {option.label}
        </button>
      );
    })}
  </div>
);

export default PayerFilterChips;
