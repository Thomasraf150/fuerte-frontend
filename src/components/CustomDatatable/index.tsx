"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DataTable, { TableColumn, TableStyles, ConditionalStyles } from 'react-data-table-component';
import { useDatatableTheme } from '@/hooks/useDatatableTheme';
import DataTableLoadingComponent from './LoadingComponent';
import StatusFilterChips from '@/components/StatusFilterChips';
import DateBranchFilters from '@/components/LoanFilters/DateBranchFilters';

// No data component with dark mode support
const NoDataComponent: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-16 bg-white dark:bg-boxdark">
      <p className="text-gray-600 dark:text-bodydark">There are no records to display</p>
    </div>
  );
};

// Server-side pagination interface following Interface Segregation Principle
export interface ServerSidePaginationProps {
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  enableSearch?: boolean; // Optional flag to enable/disable search
  searchPlaceholder?: string; // Custom search placeholder
  statusFilter?: string; // Current status filter
  onStatusFilterChange?: (status: string) => void; // Status filter change handler
  recordType?: string; // Singular form of the record type (e.g., "loan", "borrower") - defaults to "loan"
  recordTypePlural?: string; // Plural form of the record type (e.g., "loans", "borrowers") - defaults to "loans"
  // Date & Branch filters (optional)
  month?: number | null;
  year?: number | null;
  branchSubId?: number | null;
  onMonthChange?: (month: number | null) => void;
  onYearChange?: (year: number | null) => void;
  onBranchSubIdChange?: (branchSubId: number | null) => void;
  onClearFilters?: () => void;
}

// Define the props for the CustomDatatable component
interface CustomDatatableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  title: string;
  enableCustomHeader?: boolean;
  renderButton?: () => React.ReactNode;
  onRowClicked?: (row: T, event: React.MouseEvent) => void;
  apiLoading?: boolean;
  defaultSortFieldId?: string | number;

  // Server-side pagination props (optional for backward compatibility)
  serverSidePagination?: ServerSidePaginationProps;

  // Conditional row styling (optional)
  conditionalRowStyles?: ConditionalStyles<T>[];
}

// Server-side pagination controls component
const ServerSidePaginationControls: React.FC<{
  pagination: ServerSidePaginationProps;
}> = ({ pagination }) => {
  const {
    totalRecords,
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
  } = pagination;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  // Format status filter text for display
  const statusFilterText = pagination.statusFilter && pagination.statusFilter !== 'all'
    ? ` ${pagination.statusFilter.replace('_', ' ')}`
    : '';

  // Get record type labels with defaults
  const recordTypeSingular = pagination.recordType || 'loan';
  const recordTypePlural = pagination.recordTypePlural || 'loans';

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-boxdark border-t border-gray-200 dark:border-strokedark sm:px-6">
      <div className="flex items-center justify-between w-full">
        {/* Records info */}
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-bodydark">
              Showing <span className="font-medium">{startRecord}</span> to{' '}
              <span className="font-medium">{endRecord}</span> of{' '}
              <span className="font-medium">{totalRecords}</span>{statusFilterText} {totalRecords === 1 ? recordTypeSingular : recordTypePlural}
            </p>
          </div>
        </div>

        {/* Page size selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="pageSize" className="text-sm text-gray-700 dark:text-bodydark">
            Show:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-gray-300 dark:border-strokedark rounded-md px-2 py-1 text-sm bg-white dark:bg-form-input text-gray-900 dark:text-bodydark focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-primary"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Page status and numbered pagination */}
        <div className="flex items-center space-x-3">
          {/* Page status */}
          <span className="px-3 py-1 text-sm text-gray-700 dark:text-bodydark">
            Page {currentPage} of {totalPages}
          </span>

          {/* Numbered pagination */}
          <div className="flex items-center space-x-1">
            {(() => {
              const pages = [];
              const maxVisiblePages = 5;
              const halfVisible = Math.floor(maxVisiblePages / 2);

              let startPage = Math.max(1, currentPage - halfVisible);
              let endPage = Math.min(totalPages, currentPage + halfVisible);

              // Adjust if we're near the beginning or end
              if (currentPage <= halfVisible) {
                endPage = Math.min(totalPages, maxVisiblePages);
              }
              if (currentPage > totalPages - halfVisible) {
                startPage = Math.max(1, totalPages - maxVisiblePages + 1);
              }

              // Add page number buttons
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                      i === currentPage
                        ? 'bg-primary text-white border-primary dark:bg-primary dark:text-white'
                        : 'border-gray-300 dark:border-strokedark bg-white dark:bg-boxdark text-gray-700 dark:text-bodydark hover:bg-gray-50 dark:hover:bg-meta-4'
                    }`}
                  >
                    {i}
                  </button>
                );
              }

              // Add ellipsis and Last button if needed
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(
                    <span key="ellipsis" className="px-2 py-1 text-sm text-gray-500 dark:text-bodydark2">
                      ...
                    </span>
                  );
                }
                pages.push(
                  <button
                    key="last"
                    onClick={() => onPageChange(totalPages)}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-strokedark rounded-md bg-white dark:bg-boxdark text-gray-700 dark:text-bodydark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                  >
                    Last
                  </button>
                );
              }

              return pages;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add display name for ESLint
ServerSidePaginationControls.displayName = 'ServerSidePaginationControls';

// Memoized CustomHeader component (enhanced for server-side search)
const CustomHeader = React.memo<{
  title: string;
  renderButton: () => React.ReactNode;
  searchQuery: string;
  handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isServerSide?: boolean;
  enableSearch?: boolean;
  searchPlaceholder?: string;
}>(({ title, renderButton, searchQuery, handleSearch, isServerSide = false, enableSearch = true, searchPlaceholder }) => (
  <div className='border-bottom-0 rounded-top'>
    <div className='row align-items-center justify-content-between py-1 pr-1'>
      <div className='col'>
        <h4 className='m-1'>{title}</h4>
      </div>
      <div className='col text-right border-solid'>
        {enableSearch && (
          <input
            type="text"
            placeholder={isServerSide ? (searchPlaceholder || "Search...") : "Search current page..."}
            value={searchQuery}
            onChange={handleSearch}
            className="form-control border border-gray-300 dark:border-strokedark rounded-md px-4 py-1 bg-white dark:bg-form-input text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-primary"
          />
        )}
        {renderButton()}
      </div>
    </div>
  </div>
));

// Add display name for ESLint
CustomHeader.displayName = 'CustomHeader';

// Define the CustomDatatable component
const CustomDatatable = <T extends object>({
  data,
  columns,
  title,
  enableCustomHeader = false,
  renderButton = () => null,
  onRowClicked,
  apiLoading = false,
  defaultSortFieldId,
  serverSidePagination,
  conditionalRowStyles,
}: CustomDatatableProps<T>): JSX.Element => {

  // Get theme-aware styles for the datatable
  const customStyles = useDatatableTheme();

  // Determine if we're using server-side pagination
  const isServerSide = !!serverSidePagination;

  // Local search state (only used for client-side mode)
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Handle search for both client-side and server-side modes
  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;

    if (isServerSide && serverSidePagination?.onSearchChange) {
      // Server-side search
      serverSidePagination.onSearchChange(query);
    } else {
      // Client-side search
      setLocalSearchQuery(query);
    }
  }, [isServerSide, serverSidePagination]);

  // Get the appropriate search query value
  const searchQuery = isServerSide
    ? (serverSidePagination?.searchQuery || '')
    : localSearchQuery;

  // Client-side filtering (only used when not in server-side mode)
  const filteredData = useMemo(() => {
    if (isServerSide) {
      // In server-side mode, return data as-is (filtering handled by server)
      return data;
    }

    // Client-side filtering for backward compatibility
    if (!localSearchQuery) {
      return data;
    }

    console.log("Client-side filtering data with query:", localSearchQuery);
    const searchValue = localSearchQuery.toLowerCase();

    return data.filter((item) =>
      Object.keys(item).some((key) => {
        const value = item[key as keyof T];

        // Handle nested objects safely
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some((nestedValue) =>
            nestedValue &&
            nestedValue.toString().toLowerCase().includes(searchValue)
          );
        }

        // Handle primitive values
        return (
          value &&
          value.toString().toLowerCase().includes(searchValue)
        );
      })
    );
  }, [data, localSearchQuery, isServerSide]);

  return (
    <div className="responsive-table-container">
      {enableCustomHeader && (
        <CustomHeader
          title={title}
          renderButton={renderButton}
          searchQuery={searchQuery}
          handleSearch={handleSearch}
          isServerSide={isServerSide}
          enableSearch={serverSidePagination?.enableSearch !== false}
          searchPlaceholder={serverSidePagination?.searchPlaceholder}
        />
      )}

      {/* Status Filter Chips - Responsive layout for all screen sizes */}
      {isServerSide && serverSidePagination?.onStatusFilterChange && (
        <div className="px-4 sm:px-6 md:px-7 pb-4">
          <StatusFilterChips
            selectedStatus={serverSidePagination.statusFilter || 'all'}
            onStatusChange={serverSidePagination.onStatusFilterChange}
          />
          {/* Warning message when searching within a filtered status - Responsive text */}
          {searchQuery && serverSidePagination.statusFilter && serverSidePagination.statusFilter !== 'all' && (
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
                Searching within <span className="font-medium">{serverSidePagination.statusFilter.replace('_', ' ')}</span> loans only
              </p>
            </div>
          )}
        </div>
      )}

      {/* Date & Branch Filters - Integrated below status filters */}
      {isServerSide && serverSidePagination?.onMonthChange && serverSidePagination?.onYearChange && serverSidePagination?.onBranchSubIdChange && (
        <div className="px-4 sm:px-6 md:px-7 pb-4">
          <DateBranchFilters
            month={serverSidePagination.month ?? null}
            year={serverSidePagination.year ?? null}
            branchSubId={serverSidePagination.branchSubId ?? null}
            onMonthChange={serverSidePagination.onMonthChange}
            onYearChange={serverSidePagination.onYearChange}
            onBranchSubIdChange={serverSidePagination.onBranchSubIdChange}
            onClearFilters={serverSidePagination.onClearFilters || (() => {})}
          />
        </div>
      )}

      <div className="relative">
        <DataTable
          keyField="id"
          paginationPerPage={isServerSide ? serverSidePagination!.pageSize : 6}
          progressPending={apiLoading}
          progressComponent={<DataTableLoadingComponent />}
          noDataComponent={<NoDataComponent />}
          defaultSortFieldId={defaultSortFieldId}
          onRowClicked={onRowClicked}
          noHeader
          title={title}
          columns={columns}
          data={filteredData}
          customStyles={customStyles}
          pagination={!isServerSide} // Disable built-in pagination for server-side mode
          className='rounded'
          highlightOnHover
          responsive
          fixedHeader
          fixedHeaderScrollHeight="500px"
          conditionalRowStyles={conditionalRowStyles}
        />
      </div>

      {/* Custom server-side pagination controls */}
      {isServerSide && serverSidePagination && (
        <ServerSidePaginationControls pagination={serverSidePagination} />
      )}
    </div>
  );
};

export default CustomDatatable;