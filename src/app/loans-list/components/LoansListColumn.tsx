"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Trash2 } from 'react-feather';
import Button from '@/components/Button';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import PendingDeletionBadge from '@/components/PendingDeletion/PendingDeletionBadge';
import type { PendingDeletionInfo } from '@/hooks/usePendingDeletions';

const borrLoanCol = (
  handleRowClick: (row: BorrLoanRowData) => void,
  handleViewWholeLoan: (row: BorrLoanRowData) => void,
  pendingByEntityId: Map<number, PendingDeletionInfo> = new Map(),
  onPendingClick: (row: BorrLoanRowData, info: PendingDeletionInfo) => void = () => {},
): TableColumn<BorrLoanRowData>[] => [
  {
    name: 'Loan Product',
    cell: row => row.loan_product.description,
    sortable: true
  },
  {
    name: 'Borrower',
    cell: row => row?.borrower ? row.borrower.lastname + ', ' + row.borrower.firstname : '-',
    sortable: true
  },
  {
    name: 'Terms',
    cell: row => parseInt(String(row.loan_product.terms || 0)) + parseInt(String(row.loan_product.addon_terms || 0)),
    sortable: true
  },
  {
    name: 'Loan Ref#',
    cell: row => row.loan_ref,
    sortable: true,
  },
  {
    name: 'Release Date',
    cell: row => (row.released_date ? String(row.released_date).slice(0, 10) : '—'),
    sortable: false,
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
            ? 'bg-amber-200 text-graydark dark:bg-amber-900 dark:text-amber-200'
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
    // Buttons cannot ellipsize like text: the floor is what View + Remove measure (197px).
    minWidth: '200px',
    cell: row => {
      const info = pendingByEntityId.get(Number(row.id));
      const isPending = !!info;
      const deletable = row?.acctg_entry === null && row.is_closed !== '1' && row.status <= 3;

      return (
        <div className="flex items-center space-x-2">
          {isPending && deletable && (
            <PendingDeletionBadge
              info={info!}
              onClick={() => onPendingClick(row, info!)}
            />
          )}
          <Button variant="secondary" size="sm" onClick={() => handleViewWholeLoan(row)}>
            <Eye size="16" />
            <span>View</span>
          </Button>
          {deletable && isPending && (
            <Button
              variant="secondary"
              size="sm" className="pdb-disabled-action"
              onClick={() => onPendingClick(row, info!)}
            >
              <Trash2 size="16" aria-hidden="true" />
              <span>Already in deletion queue</span>
            </Button>
          )}
          {deletable && !isPending && (
            <Button variant="danger" size="sm" onClick={() => handleRowClick(row)}>
              <Trash2 size="16" aria-hidden="true" />
              <span>Remove</span>
            </Button>
          )}
        </div>
      );
    },
  },
];

export default borrLoanCol
