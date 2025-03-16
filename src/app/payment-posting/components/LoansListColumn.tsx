"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { loanStatus } from '@/utils/helper';

const borrLoanCol = (handleRowClick: (row: BorrLoanRowData) => void): TableColumn<BorrLoanRowData>[] => [
  {
    name: 'Loan Product',
    cell: row => row.loan_product.description,
    sortable: true,
    style: {
      minWidth: '370px',
    },
    width: '370px'
  },
  {
    name: 'Borrower',
    cell: row => row?.borrower.lastname + ', ' + row.borrower.firstname,
    sortable: true,
    style: {
      minWidth: '270px',
    },
    width: '270px'
  },
  {
    name: 'Terms',
    cell: row => parseInt(String(row.loan_product.terms || 0)) + parseInt(String(row.loan_product.addon_terms || 0)),
    sortable: true,
    style: {
      minWidth: '100px',
    },
    width: '100px'
  },
  {
    name: 'Loan Ref#',
    cell: row => row.loan_ref,
    sortable: true,
  },
  {
    name: 'Loan Proceeds',
    cell: row => formatNumber(Number(row.loan_proceeds)),
    sortable: true,
  },
  {
    name: 'PN Amount',
    cell: row => formatNumber(Number(row.pn_amount)),
    sortable: true,
  },
  {
    name: 'Status',
    cell: row => (
      <span
        className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded ${
          row.is_closed === '1' ? 'bg-orange-600 text-white dark:bg-orange-600 dark:text-yellow-300' :
          (row.status === 0
            ? 'bg-orange-600 text-white dark:bg-orange-600 dark:text-yellow-300'
            : row.status === 1
            ? 'bg-yellow-400 text-boxdark dark:bg-orange-600 dark:text-red'
            : row.status === 2
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : row.status === 3
            ? 'bg-green-600 text-lime-100 dark:bg-green-900 dark:text-green-300'
            : '')
        }`}
      >
        {/* {loanStatus(row.status)} */}
        {`${
          row.is_closed === '1' ? 'Closed' :
          (row.status === 0
            ? 'For Approval'
            : row.status === 1
            ? 'Approved'
            : row.status === 2
            ? 'For Releasing'
            : row.status === 3
            ? 'Released'
            : '')
        }`}
      </span>
    ),
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

export default borrLoanCol