"use client";

import { TableColumn } from 'react-data-table-component';
import { DataRowLoanCodes } from '@/utils/DataTypes';
import { Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import Button from '@/components/Button';

// loan_code
// description
// type_of_loan

/** The row's buttons: the table's Action cell and the phone card both draw these. */
export const renderLoanCodeActions = (row: DataRowLoanCodes, handleRowClick: (row: DataRowLoanCodes) => void) => (
  <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => handleRowClick(row)}><Edit3 size={16} aria-hidden="true" />Edit</Button>
      <Tooltip text="Remove">
        <Trash2 size="16" className="text-cyan-400 cursor-pointer"/>
      </Tooltip>
  </div>
);

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
    minWidth: '190px',
    button: true,
    cell: row => renderLoanCodeActions(row, handleRowClick),
  },
];

export default loanCodeListColumn