"use client";

import React, { useCallback } from 'react';
import type { TableColumn, ConditionalStyles } from 'react-data-table-component';
import { useDatatableTheme } from '@/hooks/useDatatableTheme';
import ListFilters from './ListFilters';
import MobileRows from './MobileRows';
import Pager from './Pager';
import TableHeader from './TableHeader';
import TableView from './TableView';
import { useClientSearch } from './useClientSearch';
import { useRowOpen } from './useRowOpen';

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
  recordType?: string; // Singular noun for the pager ("borrower") - defaults to "record"
  recordTypePlural?: string; // Plural noun ("borrowers") - defaults to "records"
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

  // Custom placeholder for the header search input. Works in both client-side
  // and server-side modes. When omitted, falls back to the existing defaults.
  searchPlaceholder?: string;

  /**
   * Whole-row open: where a row leads. A plain click navigates; Ctrl, Cmd or a middle click
   * opens a new tab; a click that ends a text selection, or lands on an inner link, button,
   * input, select, label or summary, does nothing here. Takes the place of onRowClicked.
   */
  rowHref?: (row: T) => string;

  /**
   * Stacked phone rows: below `md` the table is replaced by one tap target per row, showing
   * what this renders (plus a chevron). Server-side lists only.
   */
  mobileRow?: (row: T) => React.ReactNode;
}

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
  searchPlaceholder,
  rowHref,
  mobileRow,
}: CustomDatatableProps<T>): JSX.Element => {
  const isServerSide = !!serverSidePagination;
  const opensRows = Boolean(rowHref || onRowClicked);
  // A pointer and a hover tint only where a click does something.
  const customStyles = useDatatableTheme({ interactive: opensRows });
  const plural = serverSidePagination?.recordTypePlural || 'records';
  const phoneRows = isServerSide && mobileRow ? mobileRow : undefined;
  const { query: localQuery, setQuery: setLocalQuery, rows } = useClientSearch(data, isServerSide);
  const rowOpen = useRowOpen(rowHref, rows);

  // Server-side lists search on the server; client-side lists filter the rows they hold.
  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (isServerSide && serverSidePagination?.onSearchChange) serverSidePagination.onSearchChange(event.target.value);
    else setLocalQuery(event.target.value);
  }, [isServerSide, serverSidePagination, setLocalQuery]);
  const searchQuery = isServerSide ? (serverSidePagination?.searchQuery || '') : localQuery;

  return (
    <div className={opensRows ? 'responsive-table-container rows-open' : 'responsive-table-container'}>
      {enableCustomHeader && (
        <TableHeader
          title={title}
          renderButton={renderButton}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          enableSearch={serverSidePagination?.enableSearch !== false}
          placeholder={searchPlaceholder ?? serverSidePagination?.searchPlaceholder ?? (isServerSide ? 'Search...' : 'Search current page...')}
          plural={plural}
        />
      )}
      {isServerSide && <ListFilters pagination={serverSidePagination} searchQuery={searchQuery} />}
      {phoneRows && (
        <div className="md:hidden">
          <MobileRows rows={rows} render={phoneRows} rowHref={rowHref} onRowClicked={onRowClicked} loading={apiLoading} plural={plural} />
        </div>
      )}
      <div className={phoneRows ? 'relative hidden md:block' : 'relative'} {...rowOpen}>
        <TableView
          title={title}
          columns={columns}
          rows={rows}
          loading={apiLoading}
          styles={customStyles}
          clientPageSize={isServerSide ? null : 20}
          onRowClicked={rowHref ? undefined : onRowClicked}
          opensRows={opensRows}
          defaultSortFieldId={defaultSortFieldId}
          conditionalRowStyles={conditionalRowStyles}
        />
      </div>
      {isServerSide && <Pager pagination={serverSidePagination} />}
    </div>
  );
};

export default CustomDatatable;
