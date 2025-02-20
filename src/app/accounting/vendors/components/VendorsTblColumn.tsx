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
    width: '350px'

  },
  {
    name: 'Employee #',
    cell: row => row?.employee_no,
    sortable: true,
    width: '250px'
  },
  {
    name: 'Address',
    cell: row => row?.employee_position,
    sortable: true,
  },
  {
    name: 'TIN',
    cell: row => row?.tin,
    sortable: true,
  }

];

export default vendorsTblColumn