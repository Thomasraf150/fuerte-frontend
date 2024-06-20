"use client";

import { TableColumn } from 'react-data-table-component';
import { DataRow } from '../DataTypes';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';

const userListCol = (handleRowClick: (row: DataRow) => void): TableColumn<DataRow>[] => [
  {
    name: 'Branch',
    cell: row => row.branch,
    sortable: true,
  },
  {
    name: 'User',
    cell: row => {
      return (
        <div className='d-flex justify-content-left align-items-center text-truncate'>
            <div className='d-flex flex-column text-truncate'>
                <span className='d-block font-weight-semibold'>{row.user.name}</span>
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
          <Tooltip text="View Sub Branch">
            <Eye size="16" className="text-cyan-400 mr-1 cursor-pointer"/>
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