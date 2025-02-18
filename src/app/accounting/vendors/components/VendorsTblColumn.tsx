"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { RowVendorsData } from '@/utils/DataTypes';

const vendorsTblColumn = (): TableColumn<RowVendorsData>[] => [
  {
    name: 'Name',
    cell: row => row?.name,
    sortable: true,
    style: {
      minWidth: '150px',
    },
    width: '150px'
  },
  {
    name: 'Employee #',
    cell: row => row?.employee_no,
    sortable: true,
  },
  {
    name: 'Address',
    cell: row => row?.employee_position,
    sortable: true,
  },
  {
    name: 'Account Code',
    cell: row => row?.address,
    sortable: true,
  }

];

export default vendorsTblColumn