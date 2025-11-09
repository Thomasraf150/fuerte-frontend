"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2, Download } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { BorrAttachmentsRowData } from '@/utils/DataTypes';

const borrAttachmentCol = (handleRowClick: (row: BorrAttachmentsRowData) => void, handleRowDownload: (row: BorrAttachmentsRowData) => void): TableColumn<BorrAttachmentsRowData>[] => [
  {
    name: 'File Name',
    cell: row => row.name,
    sortable: true,
    grow: 2,
  },
  {
    name: 'File Type',
    cell: row => row.file_type,
    sortable: true,
    grow: 1,
  },
  {
    name: 'File Path',
    cell: row => (
      <div className="max-w-xs truncate" title={row.file_path}>
        {row.file_path}
      </div>
    ),
    sortable: true,
    grow: 1.5,
  },
  {
    name: 'Action',
    cell: row => {

      return (
        <div className="flex items-center space-x-2">
          <Tooltip text="Download">
            <Download
              onClick={() => handleRowDownload(row)}
              size="16"
              className="text-cyan-400 cursor-pointer hover:text-cyan-600 p-1 rounded transition-colors min-w-[32px] min-h-[32px]"
            />
          </Tooltip>
          <Tooltip text="Remove">
            <Trash2
              onClick={() => handleRowClick(row)}
              size="16"
              className="text-cyan-400 cursor-pointer hover:text-red-500 p-1 rounded transition-colors min-w-[32px] min-h-[32px]"
            />
          </Tooltip>
        </div>
      )
    },
  },
];

export default borrAttachmentCol