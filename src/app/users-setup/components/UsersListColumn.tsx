"use client";

import { TableColumn } from 'react-data-table-component';
import { User } from '@/utils/DataTypes';
import { Key, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import Button from '@/components/Button';

/** The row's buttons: the table's Action cell and the phone card both draw these. */
export const renderUserActions = (row: User, handleRowClick: (row: User) => void, handlePwUpdate: (row: User) => void) => (
  <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => handlePwUpdate(row)}><Key size={16} aria-hidden="true" />Update Password</Button>
      <Button variant="secondary" size="sm" onClick={() => handleRowClick(row)}><Edit3 size={16} aria-hidden="true" />Edit</Button>
      <Tooltip text="Remove">
        <Trash2 size="16" className="text-cyan-400 cursor-pointer"/>
      </Tooltip>
  </div>
);

const userListCol = (handleRowClick: (row: User) => void, handlePwUpdate: (row: User) => void): TableColumn<User>[] => [
  {
    name: 'Name',
    cell: row => row.name,
    sortable: true,
  },
  {
    name: 'Role',
    cell: row => row.role.name,
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
  },
  {
    name: 'Action',
    minWidth: '330px',
    button: true,
    cell: row => renderUserActions(row, handleRowClick, handlePwUpdate),
  },
];

export default userListCol