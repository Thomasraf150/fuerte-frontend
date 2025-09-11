"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { BorrowerRowInfo } from '@/utils/DataTypes';

const borrowerColumn = (handleRowClick: (row: BorrowerRowInfo) => void, handleRowRmBorrClick: (row: BorrowerRowInfo) => void): TableColumn<BorrowerRowInfo>[] => [
  {
    name: 'Branch',
    cell: row => row.borrower_work_background?.area?.branch_sub?.name || 'N/A',
    sortable: true,
    style: {
      minWidth: '150px',
    },
    width: '150px'
  },
  {
    name: 'First Name',
    cell: row => row.firstname,
    sortable: true,
    style: {
      minWidth: '150px',
    },
    width: '150px'
  },
  {
    name: 'Middle Name',
    cell: row => row.middlename,
    sortable: true,
    style: {
      minWidth: '230px',
    },
    width: '230px'
  },
  {
    name: 'Last Name',
    cell: row => row.lastname,
    sortable: true,
    style: {
      minWidth: '220px',
    },
    width: '220px'
  },
  {
    name: 'Residence Address',
    cell: row => row.residence_address,
    sortable: true,
    style: {
      minWidth: '500px',
    },
    width: '500px'
  },
  {
    name: 'Chief',
    cell: row => row.chief?.name || 'N/A',
    sortable: true,
  },
  {
    name: 'Date of Birth',
    cell: row => row.borrower_details?.dob || 'N/A',
    sortable: true,
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
            <Trash2 onClick={() => handleRowRmBorrClick(row)} size="16" className="text-cyan-400 ml-1 cursor-pointer"/>
          </Tooltip>
        </>
      )
    },
  },
];

export default borrowerColumn