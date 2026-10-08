"use client";

import { TableColumn } from 'react-data-table-component';
import { DataSubArea } from '@/utils/DataTypes';
import { Edit3, Trash2 } from 'react-feather';
import Button from '@/components/Button';

/** The row's buttons: the table's Action cell and the phone card both draw these. */
export const renderSubAreaActions = (row: DataSubArea, handleUpdateRowClick: (row: DataSubArea) => void, handleDeleteRow: (row: DataSubArea) => void) => (
  <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => handleUpdateRowClick(row)}><Edit3 size={16} aria-hidden="true" />Edit</Button>
      <Button variant="danger" size="sm" onClick={() => handleDeleteRow(row)}><Trash2 size={16} aria-hidden="true" />Remove</Button>
  </div>
);

const subAreaListCol = (handleUpdateRowClick: (row: DataSubArea) => void, handleDeleteRow: (row: DataSubArea) => void): TableColumn<DataSubArea>[] => [
  {
    name: 'Area',
    cell: row => row.name,
    sortable: true,
  },
  {
    name: 'Mother Area',
    cell: row => row.area.name,
    sortable: true,
  },
  {
    name: 'Action',
    minWidth: '210px',
    button: true,
    cell: row => renderSubAreaActions(row, handleUpdateRowClick, handleDeleteRow),
  },
];

export default subAreaListCol