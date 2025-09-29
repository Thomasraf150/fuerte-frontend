"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { BorrowerRowInfo } from '@/utils/DataTypes';

const borrowerColumn = (handleRowClick: (row: BorrowerRowInfo) => void, handleRowRmBorrClick: (row: BorrowerRowInfo) => void): TableColumn<BorrowerRowInfo>[] => [
  {
    name: 'Branch',
    cell: row => row.borrower_work_background?.area?.branch_sub?.name,
    sortable: true,
  },
  {
    name: 'First Name',
    cell: row => row.firstname,
    sortable: true,
  },
  {
    name: 'Middle Name',
    cell: row => row.middlename,
    sortable: true,
  },
  {
    name: 'Last Name',
    cell: row => row.lastname,
    sortable: true,
  },
  {
    name: 'Residence Address',
    cell: row => row.residence_address,
    sortable: true,
  },
  {
    name: 'Chief',
    cell: row => row.chief.name,
    sortable: true,
  },
  {
    name: 'Date of Birth',
    cell: row => row.borrower_details.dob,
    sortable: true,
  },
  {
    name: 'Action',
    cell: row => {
      
      return (
        <div className="flex items-center space-x-2">
          <Tooltip text="Edit">
            <Edit3 
              onClick={() => handleRowClick(row)} 
              size="16" 
              className="text-cyan-400 cursor-pointer hover:text-cyan-600 p-1 rounded transition-colors min-w-[32px] min-h-[32px]"
            />
          </Tooltip>
          <Tooltip text="Remove">
            <Trash2 
              onClick={() => handleRowRmBorrClick(row)} 
              size="16" 
              className="text-cyan-400 cursor-pointer hover:text-red-500 p-1 rounded transition-colors min-w-[32px] min-h-[32px]"
            />
          </Tooltip>
        </div>
      )
    },
  },
];

export default borrowerColumn