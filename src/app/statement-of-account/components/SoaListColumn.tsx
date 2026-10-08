"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { LoanStatusBadge } from '@/components/StatusBadge';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { loanStatus } from '@/utils/helper';

// SERVER-paginated list — CustomDatatable in server mode does not wire
// sortServer/onSort, so a header click would only reorder the current page.
// Columns are therefore NOT marked sortable (was advertising a broken sort).
const soaListCol = (handleRowClick: (row: BorrLoanRowData) => void): TableColumn<BorrLoanRowData>[] => [
  {
    name: 'Loan Product',
    cell: row => row.loan_product.description,
    sortable: false,
  },
  {
    name: 'Terms',
    hide: 1099,
    cell: row => parseInt(String(row.loan_product.terms || 0)) + parseInt(String(row.loan_product.addon_terms || 0)),
    sortable: false,
  },
  {
    name: 'Borrower',
    cell: row => row?.borrower.lastname + ', ' + row.borrower.firstname,
    sortable: false,
  },
  {
    name: 'Loan Ref#',
    cell: row => row.loan_ref,
    sortable: false,
  },
  {
    name: 'Loan Proceeds',
    cell: row => <span className="tabular-nums">{formatNumber(Number(row.loan_proceeds))}</span>,
    right: true,
    sortable: false,
  },
  {
    name: 'PN Amount',
    cell: row => <span className="tabular-nums">{formatNumber(Number(row.pn_amount))}</span>,
    right: true,
    sortable: false,
  },
  {
    name: 'Loan Status',
    selector: row => row.custom_status ?? '',
    cell: row => <LoanStatusBadge status={row.custom_status} />,
    sortable: false,
  },
  // {
  //   name: 'Action',
  //   cell: row => {
      
  //     return (
  //       <>
  //         <Tooltip text="Remove">
  //           <Trash2 onClick={() => handleRowClick(row)} size="16" className="text-cyan-400 ml-1 cursor-pointer"/>
  //         </Tooltip>
  //       </>
  //     )
  //   },
  //   style: {
  //     minWidth: '120px',
  //   },
  //   width: '120px'
  // },
];

export default soaListCol