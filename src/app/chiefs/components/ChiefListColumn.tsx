"use client";

import { TableColumn } from 'react-data-table-component';
import { DataChief } from '@/utils/DataTypes';
import { Edit3, Trash2 } from 'react-feather';
import Button from '@/components/Button';

/** The row's buttons: the table's Action cell and the phone card both draw these. */
export const renderChiefActions = (row: DataChief, handleUpdateRowClick: (row: DataChief) => void, handleDeleteRow: (row: DataChief) => void) => (
  <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => handleUpdateRowClick(row)}><Edit3 size={16} aria-hidden="true" />Edit</Button>
      <Button variant="danger" size="sm" onClick={() => handleDeleteRow(row)}><Trash2 size={16} aria-hidden="true" />Remove</Button>
  </div>
);

const chiefListCol = (handleUpdateRowClick: (row: DataChief) => void, handleDeleteRow: (row: DataChief) => void): TableColumn<DataChief>[] => [
  {
    name: 'Company',
    cell: row => row.name,
    sortable: true,
  },
  {
    name: 'Address',
    cell: row => row.address,
    sortable: true,
  },
  {
    name: 'Contact No.',
    cell: row => {
      return (
        <div className='d-flex justify-content-left align-items-center text-truncate'>
            <div className='d-flex flex-column text-truncate'>
                <span className="cell-text" data-tag="allowRowEvents" title={String(row.contact_no ?? '')}>{row.contact_no}</span>
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
                <span className="cell-text" data-tag="allowRowEvents" title={String(row.email ?? '')}>{row.email}</span>
            </div>
        </div> 
      )
    },
    sortable: true,
    hide: 1439,
  },
  {
    name: 'Action',
    minWidth: '210px',
    button: true,
    cell: row => renderChiefActions(row, handleUpdateRowClick, handleDeleteRow),
  },
];

export default chiefListCol