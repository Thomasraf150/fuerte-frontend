"use client";

import React from 'react';
import StatusFilterChips from '@/components/StatusFilterChips';
import DateBranchFilters from '@/components/LoanFilters/DateBranchFilters';
import type { ServerSidePaginationProps } from './index';

/** The optional status chips and date/branch filters of a server-side list (moved out of index.tsx unchanged). */
const ListFilters: React.FC<{ pagination: ServerSidePaginationProps; searchQuery: string }> = ({ pagination, searchQuery }) => (
  <>
    {/* Status Filter Chips - Responsive layout for all screen sizes */}
    {pagination.onStatusFilterChange && (
      <div className="pb-4">
        <StatusFilterChips
          selectedStatus={pagination.statusFilter || 'all'}
          onStatusChange={pagination.onStatusFilterChange}
        />
        {/* Warning message when searching within a filtered status - Responsive text */}
        {searchQuery && pagination.statusFilter && pagination.statusFilter !== 'all' && (
          <div className="mt-3 flex items-start gap-2">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">
              Searching within <span className="font-medium">{pagination.statusFilter.replace('_', ' ')}</span> loans only
            </p>
          </div>
        )}
      </div>
    )}

    {/* Date & Branch Filters - Integrated below status filters */}
    {pagination.onMonthChange && pagination.onYearChange && pagination.onBranchSubIdChange && (
      <div className="pb-4">
        <DateBranchFilters
          month={pagination.month ?? null}
          year={pagination.year ?? null}
          branchSubId={pagination.branchSubId ?? null}
          onMonthChange={pagination.onMonthChange}
          onYearChange={pagination.onYearChange}
          onBranchSubIdChange={pagination.onBranchSubIdChange}
          onClearFilters={pagination.onClearFilters || (() => {})}
        />
      </div>
    )}
  </>
);

export default ListFilters;
