"use client";

import React from 'react';
import DataTable, { ConditionalStyles, TableColumn, TableStyles } from 'react-data-table-component';
import DataTableLoadingComponent from './LoadingComponent';

// No data component with dark mode support
const NoDataComponent: React.FC = () => (
  <div className="w-full flex items-center justify-center py-16 bg-white dark:bg-boxdark">
    <p className="text-body dark:text-bodydark">There are no records to display</p>
  </div>
);

interface Props<T> {
  title: string;
  columns: TableColumn<T>[];
  rows: T[];
  loading: boolean;
  styles: TableStyles;
  /** Server-side lists page themselves (Pager); a client-side list uses the library's pager. */
  clientPageSize: number | null;
  onRowClicked?: (row: T, event: React.MouseEvent) => void;
  opensRows: boolean;
  defaultSortFieldId?: string | number;
  conditionalRowStyles?: ConditionalStyles<T>[];
}

/** The react-data-table-component table itself, as every CustomDatatable list configures it. */
function TableView<T extends object>(props: Props<T>): JSX.Element {
  const { title, columns, rows, loading, styles, clientPageSize, onRowClicked, opensRows, defaultSortFieldId, conditionalRowStyles } = props;
  return (
    <DataTable
      keyField="id"
      title={title}
      columns={columns}
      data={rows}
      customStyles={styles}
      progressPending={loading}
      progressComponent={<DataTableLoadingComponent columns={columns.filter((column) => !column.omit).length} />}
      noDataComponent={<NoDataComponent />}
      defaultSortFieldId={defaultSortFieldId}
      onRowClicked={onRowClicked}
      conditionalRowStyles={conditionalRowStyles}
      pagination={clientPageSize !== null}
      paginationPerPage={clientPageSize ?? 20}
      paginationRowsPerPageOptions={[10, 20, 50, 100]}
      highlightOnHover={opensRows}
      noHeader
      responsive
      className="rounded"
    />
  );
}

export default TableView;
