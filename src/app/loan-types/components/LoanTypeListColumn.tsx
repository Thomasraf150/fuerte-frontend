"use client";

import { TableColumn } from 'react-data-table-component';
import { DataRowLoanTypeList } from '@/utils/DataTypes';
import { Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import Button from '@/components/Button';
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
    minWidth: '330px',
    button: true,
    cell: row => {
      const info = pendingByEntityId.get(Number(row.id));
      const isPending = !!info;
      return (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleEdit(row)}><Edit3 size={16} aria-hidden="true" />Edit</Button>
          {isPending ? (
            <Tooltip text={info!.is_mine
              ? `You already filed a deletion request — click for details`
              : `${info!.requested_by_name ?? 'Someone'} already requested deletion — click for details`}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPendingClick(row, info!)}
              >
                <Trash2 size={16} aria-hidden="true" />Already in deletion queue
              </Button>
            </Tooltip>
          ) : (
            <Button variant="danger" size="sm" onClick={() => handleDelete(row)}><Trash2 size={16} aria-hidden="true" />Remove</Button>
          )}
        </div>
      );
    },
  },
];

export default loanTypeListColumn;
