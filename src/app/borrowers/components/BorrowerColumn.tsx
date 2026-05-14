"use client";

import { TableColumn } from 'react-data-table-component';
import { Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { BorrowerRowInfo } from '@/utils/DataTypes';
import BranchBadge from '@/components/BranchBadge';
import PendingDeletionBadge from '@/components/PendingDeletion/PendingDeletionBadge';
import type { PendingDeletionInfo } from '@/hooks/usePendingDeletions';

const borrowerColumn = (
  handleRowClick: (row: BorrowerRowInfo) => void,
  handleRowRmBorrClick: (row: BorrowerRowInfo) => void,
  pendingByEntityId: Map<number, PendingDeletionInfo> = new Map(),
  onPendingClick: (row: BorrowerRowInfo, info: PendingDeletionInfo) => void = () => {},
): TableColumn<BorrowerRowInfo>[] => [
  {
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
    name: 'First Name',
    cell: row => row.firstname,
    sortable: true,
  },
  {
    name: 'Middle Name',
    cell: row => row.middlename,
    sortable: true,
  },
  {
    name: 'Last Name',
    cell: row => row.lastname,
    sortable: true,
  },
  {
    name: 'Residence Address',
    cell: row => row.residence_address,
    sortable: true,
  },
  {
    name: 'Chief',
    cell: row => row.chief.name,
    sortable: true,
  },
  {
    name: 'Date of Birth',
    cell: row => row.borrower_details.dob,
    sortable: true,
  },
  {
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
