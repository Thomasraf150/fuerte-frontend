"use client";

import { TableColumn } from 'react-data-table-component';
import { DataArea } from '@/utils/DataTypes';
import { Edit3 } from 'react-feather';
import Button from '@/components/Button';
import MasterDataRemoveButton from '@/components/MasterDataRemoveButton';

/** The row's buttons: the table's Action cell and the phone card both draw these. */
export const renderAreaActions = (row: DataArea, handleUpdateRowClick: (row: DataArea) => void, handleDeleteRow: (row: DataArea) => void) => (
  <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => handleUpdateRowClick(row)}><Edit3 size={16} aria-hidden="true" />Edit</Button>
      <MasterDataRemoveButton onClick={() => handleDeleteRow(row)} />
  </div>
);

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
                <span className="cell-text" data-tag="allowRowEvents" title={String(row.description ?? '')}>{row.description}</span>
            </div>
        </div> 
      )
    },
    sortable: true,
    hide: 1439,
  },
  {
    name: 'Email',
    cell: row => {
      return (
        <div className='d-flex justify-content-left align-items-center text-truncate'>
            <div className='d-flex flex-column text-truncate'>
                <span className="cell-text" data-tag="allowRowEvents" title={String(row.description ?? '')}>{row.description}</span>
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
    cell: row => renderAreaActions(row, handleUpdateRowClick, handleDeleteRow),
  },
];

export default areaListCol