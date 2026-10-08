"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Trash2 } from 'react-feather';
import Button from '@/components/Button';
import { LoanStatusBadge } from '@/components/StatusBadge';
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
    hide: 1439,
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
    hide: 1439,
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
    name: 'Loan Status',
    selector: row => row.custom_status ?? '',
    cell: row => <LoanStatusBadge status={row.custom_status} />,
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
