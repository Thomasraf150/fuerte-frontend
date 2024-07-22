"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { BorrowerDataAttachments } from '@/utils/DataTypes';

const borrAttachmentCol = (handleRowClick: (row: BorrowerDataAttachments) => void): TableColumn<BorrowerDataAttachments>[] => [
  {
    name: 'File Name',
    cell: row => row.name,
    sortable: true,
    style: {
      minWidth: '150px',
    },
    width: '150px'
  },
  {
    name: 'File Type',
    cell: row => row.file_type,
    sortable: true,
    style: {
      minWidth: '230px',
    },
    width: '230px'
  },
  {
    name: 'File Path',
    cell: row => row.file_path,
    sortable: true,
    style: {
      minWidth: '220px',
    },
    width: '220px'
  },
  {
    name: 'Action',
    cell: row => {
      
      return (
        <>
          {/* <Tooltip text="View Sub Branch">
            <Eye size="16" className="text-cyan-400 mr-1 cursor-pointer"/>
          </Tooltip>
          {` | `} */}
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

export default borrAttachmentCol