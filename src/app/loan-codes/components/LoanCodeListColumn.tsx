"use client";

import { TableColumn } from 'react-data-table-component';
import { DataRowLoanCodes } from '@/utils/DataTypes';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';

// loan_code
// description
// type_of_loan

const loanCodeListColumn = (handleRowClick: (row: DataRowLoanCodes) => void): TableColumn<DataRowLoanCodes>[] => [
  {
    name: 'Loan Code',
    cell: row => row.code,
    sortable: true,
  },
  {
    name: 'Description',
    cell: row => row.description,
    sortable: true,
  },
  {
    name: 'Type of Loan',
    cell: row => {
      return (
        <div className='d-flex justify-content-left align-items-center text-truncate'>
            <div className='d-flex flex-column text-truncate'>
                <span className='d-block font-weight-semibold'>{row.loan_type.name}</span>
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

export default loanCodeListColumn