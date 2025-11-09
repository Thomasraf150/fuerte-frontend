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

const StatusFilterChips: React.FC<StatusFilterChipsProps> = ({
  selectedStatus,
  onStatusChange,
}) => {
  return (
    <div className="space-y-3">
      {/* Label - Hidden on mobile, shown on tablet+ */}
      <div className="hidden sm:block">
        <span className="text-sm font-medium text-gray-700 dark:text-bodydark1">
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
                px-3 py-1.5 sm:px-4 sm:py-2
                rounded-full
                text-xs sm:text-sm
                font-medium
                cursor-pointer
                transition-all duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
                whitespace-nowrap
                ${
                  isSelected
                    ? 'border-2 border-primary bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary shadow-sm'
                    : 'border border-stroke bg-white dark:bg-boxdark dark:border-strokedark text-bodydark dark:text-bodydark1 hover:bg-gray-50 dark:hover:bg-meta-4 hover:border-primary/50 dark:hover:border-primary/50'
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
