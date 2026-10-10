"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { StatusBadge } from '@/components/StatusBadge';
import { DataColListRow } from '@/utils/DataTypes';

// NOTE: this list is SERVER-paginated (CustomDatatable in server mode does not
// wire sortServer/onSort), so header clicks would only reorder the current
// 20-row page — a misleading affordance. Columns are therefore NOT marked
// sortable. Server-side ordering is fixed (loan_id DESC, newest first).
// Borrower comes first: the row's human-readable identifier, so staff find a collection by who
// paid, not by a ref code (NN/g, "Data Tables: Four Major User Tasks"). "LASTNAME, FIRSTNAME" as
// the Loans and Payment Posting lists show it.
const collectionListCol = (): TableColumn<DataColListRow>[] => [
  {
    name: 'Borrower',
    // Wraps instead of clipping: the name IS the identifier, so it is never cut off.
    cell: row => (
      <span className="block whitespace-normal break-words py-2 font-semibold uppercase leading-snug text-black dark:text-white">
        {row.borrower_name ?? '—'}
      </span>
    ),
    sortable: false,
    grow: 3,
    minWidth: '200px',
  },
  {
    name: 'Loan Ref',
    cell: row => <span className="tabular-nums">{row.loan_ref}</span>,
    sortable: false,
    minWidth: '120px',
    maxWidth: '150px',
  },
  {
    // The loan PRODUCT's name (loan_products.description), which this column always showed
    // under the misleading header "Description". Full name on hover; ends in "…" when long.
    name: 'Loan Product',
    cell: row => <span className="block truncate" title={row.description}>{row.description}</span>,
    sortable: false,
    grow: 2,
    minWidth: '180px',
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
      row.journal_ref
        ? <StatusBadge tone="posted">Posted</StatusBadge>
        : <StatusBadge tone="pending">Pending</StatusBadge>
    ),
    sortable: false,
    minWidth: '100px',
    maxWidth: '120px',
  },
];

export default collectionListCol