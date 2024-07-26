"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { BorrCoMakerRowData } from '@/utils/DataTypes';

const borrCoMakerCol = (handleRowClick: (row: BorrCoMakerRowData) => void): TableColumn<BorrCoMakerRowData>[] => [
  {
    name: 'Full Name',
    cell: row => row.name,
    sortable: true,
  },
  {
    name: 'Relationship',
    cell: row => row.relationship,
    sortable: true,
  },
  {
    name: 'Marital Status',
    cell: row => row.marital_status,
    sortable: true,
  },
  {
    name: 'Address',
    cell: row => row.address,
    sortable: true,
  },
  {
    name: 'Birthdate',
    cell: row => row.birthdate,
    sortable: true,
  },
  {
    name: 'Contact No.',
    cell: row => row.contact_no,
    sortable: true,
  },
  {
    name: 'Action',
    cell: row => {
      
      return (
        <>
          <Tooltip text="Remove">
            <Trash2 onClick={() => handleRowClick(row)} size="16" className="text-cyan-400 ml-1 cursor-pointer"/>
          </Tooltip>
        </>
      )
    },
    style: {
      minWidth: '120px',
    },
    width: '120px'
  },
];

export default borrCoMakerCol