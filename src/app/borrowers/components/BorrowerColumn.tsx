"use client";

import Link from 'next/link';
import { TableColumn } from 'react-data-table-component';
import { Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { BorrowerRowInfo } from '@/utils/DataTypes';
import BranchBadge from '@/components/BranchBadge';
import PayerBadge from '@/components/PayerBadge';
import PendingDeletionBadge from '@/components/PendingDeletion/PendingDeletionBadge';
import type { PendingDeletionInfo } from '@/hooks/usePendingDeletions';
import { borrowerListName } from './borrowerName';

/**
 * The Borrowers list from `md` up (B1, 2026-10-06); below `md` the list is phone rows
 * (BorrowerPhoneRow). Branch, Payer, First, Last, Date of birth and the actions from `md`;
 * Middle name and Chief from 1280px (react-data-table-component's `hide` is a viewport
 * max-width). No Residence Address: it is on the borrower page.
 *
 * The whole row opens the borrower (CustomDatatable rowHref); the first name is also a real
 * link, for the keyboard and screen readers. The pencil and trash are buttons, so the row's open
 * leaves their clicks alone (a bare svg with an onClick would ALSO have opened the row).
 *
 * Width budget: at 1024px with the 290px sidebar the table gets ~628px, and the six `md`
 * columns' minimums add up to 622px (130 + 88 + 100 + 100 + 88 + 116), so nothing scrolls
 * sideways there; 1280 adds Middle and Chief (822px of ~884px).
 */
const BELOW_XL = 1279;

/** 48px below `lg`, 40px from `lg` (the table shows from `md`, so these are tablet and desktop sizes). */
const ACTION = 'inline-flex h-12 w-12 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:h-10 lg:w-10';

const borrowerColumn = (
  handleRowClick: (row: BorrowerRowInfo) => void,
  handleRowRmBorrClick: (row: BorrowerRowInfo) => void,
  pendingByEntityId: Map<number, PendingDeletionInfo> = new Map(),
  onPendingClick: (row: BorrowerRowInfo, info: PendingDeletionInfo) => void = () => {},
): TableColumn<BorrowerRowInfo>[] => [
  {
    id: 1,
    name: 'Branch',
    minWidth: '130px',
    cell: row => {
      const branchSub = row.branch_sub
        ?? row.borrower_work_background?.area?.branch_sub;
      return (
        <BranchBadge
          branchName={branchSub?.branch?.name}
          subBranchName={branchSub?.name}
        />
      );
    },
    sortable: false,
  },
  {
    // Explicit ids keep every other column's data-column-id at its old
    // position-based value (Branch 1 ... Action 8; 5 was Residence Address).
    // Tests and any page CSS address columns by these ids: never renumber them.
    id: 'payer',
    name: 'Payer',
    minWidth: '88px',
    cell: row => <PayerBadge standing={row.payer_standing} borrowerId={row.id} />,
    sortable: false,
  },
  {
    id: 2,
    name: 'First Name',
    cell: row => (
      <Link
        href={`/borrowers/${row.id}`}
        aria-label={borrowerListName(row)}
        title={row.firstname}
        className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-sm font-medium text-black hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:text-white"
      >
        {row.firstname}
      </Link>
    ),
    sortable: true,
  },
  {
    id: 3,
    name: 'Middle Name',
    cell: row => row.middlename,
    sortable: true,
    hide: BELOW_XL,
  },
  {
    id: 4,
    name: 'Last Name',
    cell: row => row.lastname,
    grow: 1.3,
    sortable: true,
  },
  {
    id: 6,
    name: 'Chief',
    cell: row => row.chief?.name,
    sortable: true,
    hide: BELOW_XL,
  },
  {
    id: 7,
    name: 'Date of Birth',
    minWidth: '88px',
    cell: row => row.borrower_details?.dob,
    sortable: true,
  },
  {
    id: 8,
    name: 'Action',
    // Two 48px controls and a 4px gap, plus the cell's 8px padding a side (40px controls from `lg`).
    minWidth: '116px',
    cell: row => {
      const info = pendingByEntityId.get(Number(row.id));
      const isPending = !!info;
      return (
        <div className="flex items-center gap-1">
          <Tooltip text="Edit">
            <button type="button" aria-label={`Edit ${borrowerListName(row)}`} onClick={() => handleRowClick(row)} className={`${ACTION} text-cyan-400 hover:bg-whiten hover:text-cyan-600 dark:hover:bg-meta-4`}>
              <Edit3 size="16" aria-hidden="true" />
            </button>
          </Tooltip>
          {isPending ? (
            // The pending stamp takes the trash's place, at the same size: one control, not a
            // 24px badge beside an "already in queue" trash that opened the same dialog.
            <PendingDeletionBadge info={info!} onClick={() => onPendingClick(row, info!)} className="!h-12 !w-12 !rounded lg:!h-10 lg:!w-10" />
          ) : (
            <Tooltip text="Remove">
              <button type="button" aria-label={`Remove ${borrowerListName(row)}`} onClick={() => handleRowRmBorrClick(row)} className={`${ACTION} text-cyan-400 hover:bg-danger/10 hover:text-danger`}>
                <Trash2 size="16" aria-hidden="true" />
              </button>
            </Tooltip>
          )}
        </div>
      );
    },
  },
];

export default borrowerColumn
