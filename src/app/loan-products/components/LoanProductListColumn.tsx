"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { DataRowLoanProducts } from '@/utils/DataTypes';
import { formatMoneyOrBlank } from '@/utils/helper';

const loanProductListColumn = (handleRowClick: (row: DataRowLoanProducts) => void): TableColumn<DataRowLoanProducts>[] => [
  {
    name: 'Loan Code',
    cell: row => row.loan_code_id,
    sortable: true,
    style: {
      minWidth: '150px',
    },
    width: '150px'
  },
  {
    name: 'Description',
    cell: row => row.description,
    sortable: true,
    style: {
      minWidth: '520px',
    },
    width: '520px'
  },
  // {
  //   name: 'Loan Description',
  //   cell: row => row.description,
  //   sortable: true,
  //   style: {
  //     minWidth: '220px',
  //   },
  //   width: '220px'
  // },
  {
    name: 'Terms',
    cell: row => row.terms,
    sortable: true,
  },
  {
    name: 'Interest Rate',
    cell: row => formatMoneyOrBlank(row.interest_rate),
    sortable: true,
  },
  {
    name: 'Processing',
    cell: row => formatMoneyOrBlank(row.processing),
    sortable: true,
  },
  {
    name: 'Agent Fee',
    cell: row => formatMoneyOrBlank(row.agent_fee),
    sortable: true,
  },
  {
    name: 'Insurance',
    cell: row => formatMoneyOrBlank(row.insurance),
    sortable: true,
  },
  {
    name: 'Insurance MFee',
    cell: row => formatMoneyOrBlank(row.insurance_fee),
    sortable: true,
  },
  {
    name: 'Collection',
    cell: row => formatMoneyOrBlank(row.collection),
    sortable: true,
  },
  {
    name: 'Notarial',
    cell: row => formatMoneyOrBlank(row.notarial),
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

export default loanProductListColumn