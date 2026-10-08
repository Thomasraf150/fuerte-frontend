"use client";

import { TableColumn } from 'react-data-table-component';
import { DataSubBranches } from '@/utils/DataTypes';
import { Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import Button from '@/components/Button';
import PendingDeletionBadge from '@/components/PendingDeletion/PendingDeletionBadge';
import type { PendingDeletionInfo } from '@/hooks/usePendingDeletions';

const subBranchListCol = (
  handleUpdateSubRowClick: (row: DataSubBranches) => void,
  handleDeleteSubRow: (row: DataSubBranches) => void,
  pendingByEntityId: Map<number, PendingDeletionInfo> = new Map(),
  onPendingClick: (row: DataSubBranches, info: PendingDeletionInfo) => void = () => {},
): TableColumn<DataSubBranches>[] => [
  {
    name: 'Mother Branch',
    cell: row => row.branch.name,
    sortable: true,
  },
  {
    name: 'Branch',
    cell: row => row.name,
    sortable: true,
    style: { minWidth: '200px' },
    width: '200px',
  },
  {
    name: 'Address',
    cell: row => {
      return (
        <div className='d-flex justify-content-left align-items-center text-truncate'>
            <div className='d-flex flex-column text-truncate'>
                <span className='d-block font-weight-semibold'>{`${row.address.slice(0, 50)}...`}</span>
            </div>
        </div>
      );
    },
    sortable: true,
    style: { minWidth: '400px' },
    width: '400px',
  },
  {
    name: 'User',
    cell: row => {
      return (
        <div className='d-flex justify-content-left align-items-center text-truncate'>
            <div className='d-flex flex-column text-truncate'>
                <span className='d-block font-weight-semibold'>{row.user.name}</span>
            </div>
        </div>
      );
    },
    sortable: true,
  },
  {
    name: 'Action',
    minWidth: '330px',
    button: true,
    cell: row => {
      const info = pendingByEntityId.get(Number(row.id));
      const isPending = !!info;
      return (
        <div className="flex items-center gap-2">
          {isPending && (
            <PendingDeletionBadge
              info={info!}
              onClick={() => onPendingClick(row, info!)}
            />
          )}
          <Button variant="secondary" size="sm" onClick={() => handleUpdateSubRowClick(row)}><Edit3 size={16} aria-hidden="true" />Edit</Button>
          {isPending ? (
            <Tooltip text="Already in queue">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPendingClick(row, info!)}
              >
                <Trash2 size={16} aria-hidden="true" />Already in deletion queue
              </Button>
            </Tooltip>
          ) : (
            <Button variant="danger" size="sm" onClick={() => handleDeleteSubRow(row)}><Trash2 size={16} aria-hidden="true" />Remove</Button>
          )}
        </div>
      );
    },
  },
];

export default subBranchListCol
