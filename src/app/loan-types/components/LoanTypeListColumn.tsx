"use client";

import { TableColumn } from 'react-data-table-component';
import { DataRowLoanTypeList } from '@/utils/DataTypes';
import { Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';

const loanTypeListColumn = (
  handleEdit: (row: DataRowLoanTypeList) => void,
  handleDelete: (row: DataRowLoanTypeList) => void
): TableColumn<DataRowLoanTypeList>[] => [
  {
    name: 'Name',
    cell: row => row.name,
    sortable: true,
  },
  {
    name: 'Action',
    cell: row => (
      <>
        <Tooltip text="Edit">
          <Edit3
            onClick={() => handleEdit(row)}
            size="16"
            className="text-cyan-400 ml-1 mr-1 cursor-pointer"
          />
        </Tooltip>
        {` | `}
        <Tooltip text="Remove">
          <Trash2
            onClick={() => handleDelete(row)}
            size="16"
            className="text-cyan-400 ml-1 cursor-pointer"
          />
        </Tooltip>
      </>
    ),
  },
];

export default loanTypeListColumn;
