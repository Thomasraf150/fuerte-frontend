"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { DataRowLoanProducts } from '@/utils/DataTypes';

// type
// description
// loan_code_desc
// terms
// interest_rate
// process
// insurance
// commission
// notarial
// addon

const loanProductListColumn = (handleRowClick: (row: DataRowLoanProducts) => void): TableColumn<DataRowLoanProducts>[] => [
  {
    name: 'Type',
    cell: row => row.type,
    sortable: true,
  },
  {
    name: 'Description',
    cell: row => row.description,
    sortable: true,
  },
  {
    name: 'Loan Description',
    cell: row => row.loan_code_desc,
    sortable: true,
  },
  {
    name: 'Terms',
    cell: row => row.terms,
    sortable: true,
  },
  {
    name: 'Interest Rate',
    cell: row => row.interest_rate,
    sortable: true,
  },
  {
    name: 'Process',
    cell: row => row.process,
    sortable: true,
  },
  {
    name: 'Insurance',
    cell: row => row.insurance,
    sortable: true,
  },
  {
    name: 'Commission',
    cell: row => row.commission,
    sortable: true,
  },
  {
    name: 'Notarial',
    cell: row => row.notarial,
    sortable: true,
  },
  {
    name: 'Addon',
    cell: row => row.addon,
    sortable: true,
  },
  {
    name: 'Action',
    cell: row => {
      
      return (
        <>
          <Tooltip text="View Sub Branch">
            <Eye size="16" className="text-cyan-400 mr-1 cursor-pointer"/>
          </Tooltip>
          {` | `}
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

export default loanProductListColumn