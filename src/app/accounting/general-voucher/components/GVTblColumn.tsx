"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { RowAcctgEntry } from '@/utils/DataTypes';

const gVTblColumn = (): TableColumn<RowAcctgEntry>[] => [
  {
    name: 'Name',
    cell: row => row?.journal_name,
    sortable: true,
    style: {
      minWidth: '150px',
    },
    width: '150px'

  },
  {
    name: 'Ref #',
    cell: row => row?.journal_ref,
    sortable: true,
    width: '150px'
  },
  {
    name: 'Payee',
    selector: row => row?.borrower_full_name === '' ? row?.vendor_full_name : row?.borrower_full_name,
    cell: row => row?.borrower_full_name === '' ? row?.vendor_full_name : row?.borrower_full_name,
    sortable: true,
    width: '290px'
  },
  {
    name: 'Check #',
    cell: row => row?.check_no,
    sortable: true,
  },
  {
    name: 'Amount',
    cell: row => row?.amount,
    sortable: true,
  },
  {
    name: 'Status',
    cell: row => (
          <span
            className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded ${
            row?.is_cancelled === true ? 'bg-orange-600 text-white dark:bg-orange-600 dark:text-yellow-300' 
            : 'bg-green-600 text-lime-100 dark:bg-green-900 dark:text-green-300'
          }`}
          >
            {`${
              row?.is_cancelled === true ? 'Cancelled' :
              'Active'
            }`}
          </span>
        ),
    sortable: true,
  },
  {
    name: 'Journal Date',
    cell: row => row?.journal_date,
    sortable: true,
  }

];

export default gVTblColumn