"use client";

import { TableColumn } from 'react-data-table-component';
import { Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { BorrowerRowInfo } from '@/utils/DataTypes';
import BranchBadge from '@/components/BranchBadge';
import PayerBadge from '@/components/PayerBadge';
import PendingDeletionBadge from '@/components/PendingDeletion/PendingDeletionBadge';
import type { PendingDeletionInfo } from '@/hooks/usePendingDeletions';

const borrowerColumn = (
  handleRowClick: (row: BorrowerRowInfo) => void,
  handleRowRmBorrClick: (row: BorrowerRowInfo) => void,
  pendingByEntityId: Map<number, PendingDeletionInfo> = new Map(),
  onPendingClick: (row: BorrowerRowInfo, info: PendingDeletionInfo) => void = () => {},
): TableColumn<BorrowerRowInfo>[] => [
  {
    id: 1,
    name: 'Branch',
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
    // position-based value. app/borrowers/styles.css hides 3 (Middle Name) and
    // 6 (Chief) on phones, and that CSS also reaches the tables on the borrower
    // page, so it must not be renumbered.
    id: 'payer',
    name: 'Payer',
    cell: row => <PayerBadge standing={row.payer_standing} borrowerId={row.id} />,
    sortable: false,
  },
  {
    id: 2,
    name: 'First Name',
    cell: row => row.firstname,
    sortable: true,
  },
  {
    id: 3,
    name: 'Middle Name',
    cell: row => row.middlename,
    sortable: true,
  },
  {
    id: 4,
    name: 'Last Name',
    cell: row => row.lastname,
    sortable: true,
  },
  {
    id: 5,
    name: 'Residence Address',
    cell: row => row.residence_address,
    sortable: true,
  },
  {
    id: 6,
    name: 'Chief',
    cell: row => row.chief.name,
    sortable: true,
  },
  {
    id: 7,
    name: 'Date of Birth',
    cell: row => row.borrower_details.dob,
    sortable: true,
  },
  {
    id: 8,
    name: 'Action',
    cell: row => {
      const info = pendingByEntityId.get(Number(row.id));
      const isPending = !!info;
      return (
        <div className="flex items-center space-x-2">
          {isPending && (
            <PendingDeletionBadge
              info={info!}
              onClick={() => onPendingClick(row, info!)}
            />
          )}
          <Tooltip text="Edit">
            <Edit3
              onClick={() => handleRowClick(row)}
              size="16"
              className="text-cyan-400 cursor-pointer hover:text-cyan-600 p-1 rounded transition-colors min-w-[32px] min-h-[32px]"
            />
          </Tooltip>
          {isPending ? (
            <Tooltip text="Already in queue">
              <Trash2
                onClick={() => onPendingClick(row, info!)}
                size="16"
                className="pdb-disabled-action p-1 min-w-[32px] min-h-[32px]"
                aria-label="Already in deletion queue"
              />
            </Tooltip>
          ) : (
            <Tooltip text="Remove">
              <Trash2
                onClick={() => handleRowRmBorrClick(row)}
                size="16"
                className="text-cyan-400 cursor-pointer hover:text-red-500 p-1 rounded transition-colors min-w-[32px] min-h-[32px]"
              />
            </Tooltip>
          )}
        </div>
      );
    },
  },
];

export default borrowerColumn
