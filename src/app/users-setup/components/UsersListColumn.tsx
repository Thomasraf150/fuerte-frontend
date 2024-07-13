"use client";

import { TableColumn } from 'react-data-table-component';
import { User } from '@/utils/DataTypes';
import { Key, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';

const userListCol = (handleRowClick: (row: User) => void, handlePwUpdate: (row: User) => void): TableColumn<User>[] => [
  {
    name: 'Name',
    cell: row => row.name,
    sortable: true,
  },
  {
    name: 'Email',
    cell: row => {
      return (
        <div className='d-flex justify-content-left align-items-center text-truncate'>
            <div className='d-flex flex-column text-truncate'>
                <span className='d-block font-weight-semibold'>{row.email}</span>
            </div>
        </div> 
      )
    },
    sortable: true,
  },
  {
    name: 'Action',
    cell: row => {
      
      return (
        <>
          <Tooltip text="Update Password">
            <Key onClick={() => handlePwUpdate(row)} size="16" className="text-cyan-400 mr-1 cursor-pointer"/>
          </Tooltip>
          {` | `}
          <Tooltip text="Edit">
            <Edit3 onClick={() => handleRowClick(row)} size="16" className="text-cyan-400 ml-1 mr-1 cursor-pointer"/>
          </Tooltip>
          {` | `}
          <Tooltip text="Remove">
            <Trash2 size="16" className="text-cyan-400 ml-1 cursor-pointer"/>
          </Tooltip>
        </>
      )
    },
  },
];

export default userListCol