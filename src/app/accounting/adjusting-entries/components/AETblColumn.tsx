"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { RowAcctgEntry } from '@/utils/DataTypes';
import { formatMoneyOrBlank } from '@/utils/helper';

const aETblColumn = (): TableColumn<RowAcctgEntry>[] => [
  {
    name: 'Name',
    cell: row => row?.journal_name,
    sortable: true,

  },
  {
    name: 'Ref #',
    cell: row => row?.journal_ref,
    sortable: true,
  },
  {
    name: 'Check #',
    cell: row => row?.check_no,
    sortable: true,
  },
  {
    name: 'Amount',
    cell: row => <span className="tabular-nums">{formatMoneyOrBlank(row?.amount)}</span>,
    right: true,
    sortable: true,
  },
  {
    name: 'Journal Date',
    cell: row => row?.journal_date,
    sortable: true,
  }

];

export default aETblColumn