"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { RowAcctgEntry } from '@/utils/DataTypes';

const aETblColumn = (): TableColumn<RowAcctgEntry>[] => [
  {
    name: 'Name',
    cell: row => row?.journal_name,
    sortable: true,
    style: {
      minWidth: '150px',
    },
    width: '350px'

  },
  {
    name: 'Ref #',
    cell: row => row?.journal_ref,
    sortable: true,
    width: '250px'
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
    name: 'Journal Date',
    cell: row => row?.journal_date,
    sortable: true,
  }

];

export default aETblColumn