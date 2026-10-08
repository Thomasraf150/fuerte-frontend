"use client";

import { TableColumn } from 'react-data-table-component';
import { ChevronRight } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { LoanStatusBadge } from '@/components/StatusBadge';
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
    hide: 1199,
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
    hide: 1199,
    cell: row => <span className="tabular-nums">{formatNumber(Number(row.loan_proceeds))}</span>,
    right: true,
    sortable: true,
  },
  {
    name: 'PN Amount',
    cell: row => <span className="tabular-nums">{formatNumber(Number(row.pn_amount))}</span>,
    right: true,
    sortable: true,
  },
  {
    name: 'Status',
    selector: row => row.custom_status ?? '',
    cell: row => <LoanStatusBadge status={row.custom_status} />,
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