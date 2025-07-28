"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { loanStatus } from '@/utils/helper';

const borrLoanCol = (handleRowClick: (row: BorrLoanRowData) => void, handleViewWholeLoan: (row: BorrLoanRowData) => void): TableColumn<BorrLoanRowData>[] => [
  {
    name: 'Loan Product',
    cell: row => row.loan_product.description,
    style: {
      minWidth: '370px',
    },
    width: '370px',
    sortable: true
  },
  {
    name: 'Borrower',
    cell: row => row?.borrower.lastname + ', ' + row.borrower.firstname,
    style: {
      minWidth: '270px',
    },
    width: '270px',
    sortable: true

  },
  {
    name: 'Terms',
    cell: row => parseInt(String(row.loan_product.terms || 0)) + parseInt(String(row.loan_product.addon_terms || 0)),
    style: {
      minWidth: '100px',
    },
    width: '100px',
    sortable: true

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
    name: 'Loan Status',
    selector: row => row.custom_status ?? '',
    cell: row => (
      <span
        className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded ${
          row.custom_status === 'Closed' ? 'bg-orange-600 text-white dark:bg-orange-600 dark:text-yellow-300' :
          (row.custom_status === 'For Approval'
            ? 'bg-orange-600 text-white dark:bg-orange-600 dark:text-yellow-300'
            : row.custom_status === 'Approved'
            ? 'bg-yellow-400 text-boxdark dark:bg-orange-600 dark:text-red'
            : row.custom_status === 'For Releasing'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : row.custom_status === 'Released'
            ? 'bg-green-600 text-lime-100 dark:bg-green-900 dark:text-green-300'
            : row.custom_status === 'Posted'
            ? 'bg-amber-200 text-graydark dark:bg-green-900 dark:text-green-300'
            : '')
        }`}
      >
      {row.custom_status}
      </span>
    ),
    sortable: true,
  },
  {
    name: 'Action',
    cell: row => {
      
      return (
        <>
          <Tooltip text="View">
            <Eye onClick={() => handleViewWholeLoan(row)} size="16" className="text-cyan-400 mr-1 cursor-pointer"/>
          </Tooltip>
          {
          row?.acctg_entry !== null ? ('') :
          (row.is_closed === '1' ? (
            ''
          ) :
          (row.status < 3
            ? (
              <>
                {` | `}
                <Tooltip text="Remove">
                  <Trash2 onClick={() => handleRowClick(row)} size="16" className="text-cyan-400 ml-1 cursor-pointer"/>
                </Tooltip>
              </>
            ) : ('')))
          }
          
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