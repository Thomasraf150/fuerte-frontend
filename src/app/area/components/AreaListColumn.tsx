"use client";

import { TableColumn } from 'react-data-table-component';
import { DataArea } from '@/utils/DataTypes';
import { Edit3, Trash2 } from 'react-feather';
import Button from '@/components/Button';

const areaListCol = (handleUpdateRowClick: (row: DataArea) => void, handleDeleteRow: (row: DataArea) => void): TableColumn<DataArea>[] => [
  {
    name: 'Company',
    cell: row => row.name,
    sortable: true,
  },
  {
    name: 'Address',
    cell: row => row.description,
    sortable: true,
  },
  {
    name: 'Contact No.',
    cell: row => {
      return (
        <div className='d-flex justify-content-left align-items-center text-truncate'>
            <div className='d-flex flex-column text-truncate'>
                <span className='d-block font-weight-semibold'>{row.description}</span>
            </div>
        </div> 
      )
    },
    sortable: true,
  },
  {
    name: 'Email',
    cell: row => {
      return (
        <div className='d-flex justify-content-left align-items-center text-truncate'>
            <div className='d-flex flex-column text-truncate'>
                <span className='d-block font-weight-semibold'>{row.description}</span>
            </div>
        </div> 
      )
    },
    sortable: true,
  },
  {
    name: 'Action',
    minWidth: '210px',
    button: true,
    cell: row => {
      return (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleUpdateRowClick(row)}><Edit3 size={16} aria-hidden="true" />Edit</Button>
          <Button variant="danger" size="sm" onClick={() => handleDeleteRow(row)}><Trash2 size={16} aria-hidden="true" />Remove</Button>
        </div>
      );
    },
  },
];

export default areaListCol