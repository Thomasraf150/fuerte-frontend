"use client";

import { TableColumn } from 'react-data-table-component';
import { RowAcctgEntry } from '@/utils/DataTypes';

const formatAmount = (row: RowAcctgEntry): string => {
  const total = row?.acctg_details?.reduce(
    (sum: number, d: any) => sum + parseFloat(d.debit || '0'), 0
  ) || 0;
  return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const crjTblColumn = (): TableColumn<RowAcctgEntry>[] => [
  {
    name: 'Description',
    cell: row => row?.journal_desc,
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
    cell: row => formatAmount(row),
    sortable: true,
    right: true,
  },
  {
    name: 'Journal Date',
    cell: row => row?.journal_date,
    sortable: true,
  }
];

export default crjTblColumn
