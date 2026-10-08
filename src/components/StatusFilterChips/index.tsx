"use client";

import React from 'react';

export interface StatusOption {
  label: string;
  value: string;
}

interface StatusFilterChipsProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

const statusOptions: StatusOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Posted', value: 'posted' },
  { label: 'Closed', value: 'closed' },
  { label: 'For Approval', value: 'for_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'For Releasing', value: 'for_releasing' },
  { label: 'Released', value: 'released' },
];

/**
 * Status chips, square like every button (house rule) and 48px on phones / 40px from lg. An
 * unselected chip is black text on a 3:1 border: the old light-grey text (1.9:1) read as disabled.
 */
const StatusFilterChips: React.FC<StatusFilterChipsProps> = ({
  selectedStatus,
  onStatusChange,
}) => {
  return (
    <div className="space-y-3">
      {/* Label - Hidden on mobile, shown on tablet+ */}
      <div className="hidden sm:block">
        <span className="text-sm font-semibold text-black dark:text-bodydark1">
          Filter by Status:
        </span>
      </div>

      {/* Filter chips container - Responsive grid */}
      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((option) => {
          const isSelected = selectedStatus === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              className={`
                inline-flex min-h-12 items-center px-4 lg:min-h-10
                text-sm
                font-medium
                cursor-pointer
                transition-all duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
                whitespace-nowrap
                ${
                  isSelected
                    ? 'border-2 border-primary bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-olive-300'
                    : 'border border-field bg-white text-black hover:border-primary hover:text-primary dark:border-field-dark dark:bg-boxdark dark:text-bodydark1 dark:hover:border-olive-300'
                }
              `}
              aria-pressed={isSelected}
              aria-label={`Filter by ${option.label}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StatusFilterChips;
