"use client";

import { TableColumn } from 'react-data-table-component';
import { DataBranches } from '@/utils/DataTypes';
import { Eye, Edit3 } from 'react-feather';
import Button from '@/components/Button';

const branchListCol = (
    handleUpdateRowClick: (row: DataBranches) => void, 
    handleSubViewRowClick: (id: number) => void, 
    handleDeleteRow: (id: number) => void): TableColumn<DataBranches>[] => [
  {
    name: 'Group',
    cell: row => row.branch_group?.code ?? '—',
    sortable: true,
  },
  {
    name: 'Branch',
    cell: row => row.name,
    sortable: true,
  },
  {
    name: 'User',
    cell: row => {
      // Most branches have no manager assigned (branches.user_id is NULL for 10
      // of 13), so this must not dereference a missing relation — it crashed the
      // whole page before the optional chaining was added.
      return (
        <div className='d-flex justify-content-left align-items-center text-truncate'>
            <div className='d-flex flex-column text-truncate'>
                <span className='d-block font-weight-semibold'>{row.user?.name ?? '—'}</span>
            </div>
        </div>
      )
    },
    sortable: true,
  },
  {
    name: 'Action',
    minWidth: '270px',
    button: true,
    cell: row => {
      return (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleSubViewRowClick(Number(row.id))}><Eye size={16} aria-hidden="true" />View Sub Branch</Button>
          <Button variant="secondary" size="sm" onClick={() => handleUpdateRowClick(row)}><Edit3 size={16} aria-hidden="true" />Edit</Button>
        </div>
      );
    },
  },
];

export default branchListCol