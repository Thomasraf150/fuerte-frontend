"use client";

import { TableColumn } from 'react-data-table-component';
import { ExternalLink } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { loanStatus } from '@/utils/helper';

const borrLoanCol = (
  handleRowClick: (row: BorrLoanRowData) => void,
  handleCheckboxChange: (row: BorrLoanRowData, isChecked: boolean) => void,
  handleJumpToLoan: (row: BorrLoanRowData) => void,
): TableColumn<BorrLoanRowData>[] => [
  {
    name: '',
    cell: row => (
      // row.status === 3 && (
      //   <input
      //     type="checkbox"
      //     onChange={(e) => handleCheckboxChange(row, e.target.checked)}
      //     className="cursor-pointer"
      //   />
      // )
      (
        row.is_closed === '1'
        ? (<></>)
        : (
          (
            row.status === 3 && (
              <input
                type="checkbox"
                onChange={(e) => handleCheckboxChange(row, e.target.checked)}
                className="cursor-pointer"
              />
            )
          )
        )
      )
    ),
    width: '50px',
    style: {
      justifyContent: 'center',
    },
  },
  {
    name: 'Loan Product',
    cell: row => row.loan_product.description.substring(0,40),
    sortable: true,
    minWidth: '200px',
    maxWidth: '350px',
    grow: 2,
  },
  {
    name: 'Loan Ref#',
    cell: row => row.loan_ref,
    sortable: true,
    minWidth: '120px',
    grow: 1,
  },
  {
    name: 'Loan Proceeds',
    cell: row => formatNumber(Number(row.loan_proceeds)),
    sortable: true,
    minWidth: '130px',
    grow: 1,
    right: true,
  },
  {
    name: 'PN Amount',
    cell: row => formatNumber(Number(row.pn_amount)),
    sortable: true,
    minWidth: '130px',
    grow: 1,
    right: true,
  },
  {
    name: 'Loan Status',
    cell: row => (
      <span
        className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
          row?.acctg_entry !== null ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
          (row.is_closed === '1' ? 'bg-orange-600 text-white dark:bg-orange-600 dark:text-yellow-300' :
          (row.status === 0
            ? 'bg-orange-600 text-white dark:bg-orange-600 dark:text-yellow-300'
            : row.status === 1
            ? 'bg-yellow-400 text-boxdark dark:bg-orange-600 dark:text-yellow-300'
            : row.status === 2
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : row.status === 3
            ? 'bg-green-600 text-lime-100 dark:bg-green-900 dark:text-green-300'
            : ''))
        }`}
      >
        {`${
          row?.acctg_entry !== null ? 'Posted' : (row.is_closed === '1' ? 'Closed' :
          loanStatus(row.status))
        }`}
      </span>
    ),
    sortable: true,
    minWidth: '120px',
    grow: 1,
  },
  {
    name: 'Action',
    cell: row => (
      <Tooltip text="Jump to Loan Details">
        <ExternalLink
          onClick={(e) => {
            e.stopPropagation();
            handleJumpToLoan(row);
          }}
          size="16"
          className="text-cyan-400 cursor-pointer hover:text-cyan-600 transition-colors"
        />
      </Tooltip>
    ),
    width: '100px',
    style: { justifyContent: 'center' },
  },
];

export default borrLoanCol