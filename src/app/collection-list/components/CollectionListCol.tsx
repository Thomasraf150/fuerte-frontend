"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { DataColListRow } from '@/utils/DataTypes';

const collectionListCol = (): TableColumn<DataColListRow>[] => [
  {
    name: 'Loan Ref',
    cell: row => row.loan_ref,
    sortable: true,
    style: {
      minWidth: '150px',
    },
    width: '150px'
  },
  {
    name: 'Description',
    cell: row => row.description.slice(0, 35),
    sortable: true,
  },
  {
    name: 'Due Date',
    cell: row => row.due_date,
    sortable: true,
  },
  {
    name: 'Collection Date',
    cell: row => row.trans_date,
    sortable: true,
  },

];

export default collectionListCol