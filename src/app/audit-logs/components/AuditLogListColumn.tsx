"use client";

import { TableColumn } from 'react-data-table-component';
import { DataArea } from '@/utils/DataTypes';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';

const auditLogListCol = (handleUpdateRowClick: (row: DataArea) => void, handleDeleteRow: (row: DataArea) => void): TableColumn<DataArea>[] => [
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
    cell: row => {
      
      return (
        <>
          {/* <Tooltip text="View Sub Branch">
            <Eye onClick={() => handleUpdateSubRowClick(row)} size="16" className="text-cyan-400 mr-1 cursor-pointer"/>
          </Tooltip>
          {` | `} */}
          <Tooltip text="Edit">
            <Edit3 onClick={() => handleUpdateRowClick(row)} size="16" className="text-cyan-400 ml-1 mr-1 cursor-pointer"/>
          </Tooltip>
          {` | `}
          <Tooltip text="Remove">
            <Trash2 size="16" onClick={() => handleDeleteRow(row)} className="text-cyan-400 ml-1 cursor-pointer"/>
          </Tooltip>
        </>
      )
    },
  },
];

export default auditLogListCol