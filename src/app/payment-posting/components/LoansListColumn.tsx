"use client";

import { TableColumn } from 'react-data-table-component';
import { ChevronRight } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { loanStatus } from '@/utils/helper';

const borrLoanCol = (handleRowClick: (row: BorrLoanRowData) => void): TableColumn<BorrLoanRowData>[] => [
  {
    name: 'Loan Product',
    cell: row => row.loan_product.description,
    sortable: true,
  },
  {
    name: 'Borrower',
    cell: row => (row?.borrower?.lastname ?? '') + ', ' + (row?.borrower?.firstname ?? ''),
    sortable: true,
  },
  {
    name: 'Terms',
    cell: row => parseInt(String(row.loan_product.terms || 0)) + parseInt(String(row.loan_product.addon_terms || 0)),
    sortable: true,
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
    selector: row => row.custom_status ?? '',
    cell: row => (
      <span
        className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded ${
          row.custom_status === 'Posted (Closed)' ? 'bg-slate-600 text-white dark:bg-slate-500 dark:text-white' :
          row.custom_status === 'Closed' ? 'bg-orange-600 text-white dark:bg-orange-600 dark:text-yellow-300' :
          (row.custom_status === 'For Approval'
            ? 'bg-orange-600 text-white dark:bg-orange-600 dark:text-yellow-300'
            : row.custom_status === 'Approved'
            ? 'bg-yellow-400 text-boxdark dark:bg-orange-600 dark:text-yellow-300'
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
          {/* Opens the loan, as the row does (closed-loan toast included). It was a trash
              icon labelled "Remove" that also only ever opened the loan. */}
          <Tooltip text="Open">
            <button
              type="button"
              aria-label={row.loan_ref ? `Open loan ${row.loan_ref}` : 'Open loan'}
              onClick={() => handleRowClick(row)}
              className="inline-flex h-12 w-12 items-center justify-center rounded text-primary transition-colors hover:bg-whiten focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:h-10 lg:w-10 dark:hover:bg-meta-4"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </Tooltip>
        </>
      )
    },
  },
];

export default borrLoanCol