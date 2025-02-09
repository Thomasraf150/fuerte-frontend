"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { DataLoanProceedAcctData } from '@/utils/DataTypes';

const loanProcListCol = (handleRowClick: (row: DataLoanProceedAcctData) => void): TableColumn<DataLoanProceedAcctData>[] => [
  {
    name: 'Branch',
    cell: row => row?.branch_sub?.name,
    sortable: true,
    style: {
      minWidth: '150px',
    },
    width: '150px'
  },
  {
    name: 'Description',
    cell: row => row?.description,
    sortable: true,
  },
  {
    name: 'Account Name',
    cell: row => row?.account?.account_name,
    sortable: true,
  },
  {
    name: 'Account Code',
    cell: row => row?.account?.number,
    sortable: true,
  },

];

export default loanProcListCol