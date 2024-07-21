"use client";

import { TableColumn } from 'react-data-table-component';
import { DataSubArea } from '@/utils/DataTypes';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';

const subAreaListCol = (handleUpdateRowClick: (row: DataSubArea) => void, handleDeleteRow: (row: DataSubArea) => void): TableColumn<DataSubArea>[] => [
  {
    name: 'Area',
    cell: row => row.name,
    sortable: true,
  },
  {
    name: 'Mother Area',
    cell: row => row.area.name,
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

export default subAreaListCol