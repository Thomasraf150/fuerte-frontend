"use client";

import React, { useCallback, useMemo } from 'react';
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

  // A visible label above the header search box (optional; otherwise it is named by aria-label).
  searchLabel?: string;

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
  /** Phone rows only: the row's buttons, drawn under its content (see MobileRows `actions`). */
  mobileActions?: (row: T) => React.ReactNode;
  /** The list failed to load and the page shows an ErrorAlert: draw no empty message and no pager. */
  loadFailed?: boolean;
}

// Define the CustomDatatable component
/**
 * Long text ends in "…" instead of being cut flat at the column edge, where it read as part of
 * the next column ("NEW-MANILA TEACH" + "Garcia…"). A cell is a flex box, where text-overflow
 * cannot apply, so a plain-text cell (a `cell:` that returns a string or number) is wrapped in
 * a .cell-text span (app/styles.css) with the full value as its tooltip. The span carries
 * data-tag="allowRowEvents": without it the library ignores clicks on it and rows stop opening.
 * Cells that return elements (badges, buttons, links) are left as they are.
 */
function withCellText<T>(columns: TableColumn<T>[]): TableColumn<T>[] {
  return columns.map((column) => {
    const render = column.cell;
    if (!render) return column;
    return {
      ...column,
      cell: (row: T, rowIndex: number, col: TableColumn<T>, id: string | number) => {
        const out = render(row, rowIndex, col, id);
        if (typeof out !== 'string' && typeof out !== 'number') return out;
        return <span className="cell-text" data-tag="allowRowEvents" title={String(out)}>{out}</span>;
      },
    };
  });
}

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
  searchLabel,
  rowHref,
  mobileRow,
  mobileActions,
  loadFailed = false,
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
  const textColumns = useMemo(() => withCellText(columns), [columns]);
  // A failed load keeps the search and filters (a bad filter may be the cause) but draws no rows,
  // no "No records to show." and no pager: the page's ErrorAlert says what happened.
  const showBody = !(loadFailed && rows.length === 0 && !apiLoading);

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
          label={searchLabel}
        />
      )}
      {isServerSide && <ListFilters pagination={serverSidePagination} searchQuery={searchQuery} />}
      {showBody && phoneRows && (
        <div className="md:hidden">
          <MobileRows rows={rows} render={phoneRows} actions={mobileActions} rowHref={rowHref} onRowClicked={onRowClicked} loading={apiLoading} plural={plural} />
        </div>
      )}
      {showBody && (
      <div className={phoneRows ? 'relative hidden md:block' : 'relative'} {...rowOpen}>
        <TableView
          title={title}
          columns={textColumns}
          rows={rows}
          loading={apiLoading}
          styles={customStyles}
          clientPageSize={isServerSide ? null : 20}
          onRowClicked={rowHref ? undefined : onRowClicked}
          opensRows={opensRows}
          defaultSortFieldId={defaultSortFieldId}
          conditionalRowStyles={conditionalRowStyles}
          plural={plural}
        />
      </div>
      )}
      {showBody && isServerSide && <Pager pagination={serverSidePagination} />}
    </div>
  );
};

export default CustomDatatable;
