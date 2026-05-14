"use client";

import { TableColumn } from 'react-data-table-component';
import { DataRowLoanTypeList } from '@/utils/DataTypes';
import { Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import PendingDeletionBadge from '@/components/PendingDeletion/PendingDeletionBadge';
import type { PendingDeletionInfo } from '@/hooks/usePendingDeletions';

const loanTypeListColumn = (
  handleEdit: (row: DataRowLoanTypeList) => void,
  handleDelete: (row: DataRowLoanTypeList) => void,
  pendingByEntityId: Map<number, PendingDeletionInfo> = new Map(),
  onPendingClick: (row: DataRowLoanTypeList, info: PendingDeletionInfo) => void = () => {},
): TableColumn<DataRowLoanTypeList>[] => [
  {
    name: 'Name',
    cell: row => {
      const info = pendingByEntityId.get(Number(row.id));
      return (
        <div className="flex items-center gap-2">
          <span>{row.name}</span>
          {info && <PendingDeletionBadge info={info} />}
        </div>
      );
    },
    sortable: true,
  },
  {
    name: 'Action',
    cell: row => {
      const info = pendingByEntityId.get(Number(row.id));
      const isPending = !!info;
      return (
        <>
          <Tooltip text="Edit">
            <Edit3
              onClick={() => handleEdit(row)}
              size="16"
              className="text-cyan-400 ml-1 mr-1 cursor-pointer"
            />
          </Tooltip>
          {` | `}
          {isPending ? (
            <Tooltip text={info!.is_mine
              ? `You already filed a deletion request — click for details`
              : `${info!.requested_by_name ?? 'Someone'} already requested deletion — click for details`}>
              <Trash2
                onClick={() => onPendingClick(row, info!)}
                size="16"
                className="pdb-disabled-action ml-1"
                aria-label="Already in deletion queue"
              />
            </Tooltip>
          ) : (
            <Tooltip text="Remove">
              <Trash2
                onClick={() => handleDelete(row)}
                size="16"
                className="text-cyan-400 ml-1 cursor-pointer"
              />
            </Tooltip>
          )}
        </>
      );
    },
  },
];

export default loanTypeListColumn;
