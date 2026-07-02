"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { DataColListRow } from '@/utils/DataTypes';

// NOTE: this list is SERVER-paginated (CustomDatatable in server mode does not
// wire sortServer/onSort), so header clicks would only reorder the current
// 20-row page — a misleading affordance. Columns are therefore NOT marked
// sortable. Server-side ordering is fixed (loan_id DESC, newest first).
const collectionListCol = (): TableColumn<DataColListRow>[] => [
  {
    name: 'Loan Ref',
    cell: row => row.loan_ref,
    sortable: false,
    minWidth: '120px',
    maxWidth: '150px',
  },
  {
    name: 'Description',
    cell: row => row.description.slice(0, 35),
    sortable: false,
    grow: 2,
    minWidth: '200px',
  },
  {
    name: 'Due Date',
    cell: row => row.due_date,
    sortable: false,
    minWidth: '100px',
    maxWidth: '120px',
  },
  {
    name: 'Collection Date',
    cell: row => row.trans_date,
    sortable: false,
    minWidth: '120px',
    maxWidth: '150px',
  },
  {
    name: 'Status',
    cell: row => (
      row.journal_ref ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Posted
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Pending
        </span>
      )
    ),
    sortable: false,
    minWidth: '100px',
    maxWidth: '120px',
  },
];

export default collectionListCol