"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { BorrAttachmentsRowData } from '@/utils/DataTypes';

const borrAttachmentCol = (handleRowClick: (row: BorrAttachmentsRowData) => void): TableColumn<BorrAttachmentsRowData>[] => [
  {
    name: 'File Name',
    cell: row => row.name,
    sortable: true,
  },
  {
    name: 'File Type',
    cell: row => row.file_type,
    sortable: true,
  },
  {
    name: 'File Path',
    cell: row => row.file_path,
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

export default borrAttachmentCol