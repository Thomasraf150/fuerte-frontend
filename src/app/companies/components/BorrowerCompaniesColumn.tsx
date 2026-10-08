"use client";

import { TableColumn } from 'react-data-table-component';
import { DataBorrCompanies } from '@/utils/DataTypes';
import { Edit3, Trash2 } from 'react-feather';
import Button from '@/components/Button';

/** The row's buttons: the table's Action cell and the phone card both draw these. */
export const renderCompanyActions = (row: DataBorrCompanies, handleUpdateRowClick: (row: DataBorrCompanies) => void, handleDeleteRow: (row: DataBorrCompanies) => void) => (
  <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => handleUpdateRowClick(row)}><Edit3 size={16} aria-hidden="true" />Edit</Button>
      <Button variant="danger" size="sm" onClick={() => handleDeleteRow(row)}><Trash2 size={16} aria-hidden="true" />Remove</Button>
  </div>
);

const borrowerCompaniesCol = (handleUpdateRowClick: (row: DataBorrCompanies) => void, handleDeleteRow: (row: DataBorrCompanies) => void): TableColumn<DataBorrCompanies>[] => [
  {
    name: 'Company',
    cell: row => row.name,
    sortable: true,
  },
  {
    name: 'Address',
    cell: row => row.address,
    sortable: true,
  },
  {
    name: 'Contact No.',
    cell: row => {
      return (
        <div className='d-flex justify-content-left align-items-center text-truncate'>
            <div className='d-flex flex-column text-truncate'>
                <span className='d-block font-weight-semibold'>{row.contact_no}</span>
            </div>
        </div> 
      )
    },
    sortable: true,
    hide: 1439,
  },
  {
    name: 'Email',
    cell: row => {
      return (
        <div className='d-flex justify-content-left align-items-center text-truncate'>
            <div className='d-flex flex-column text-truncate'>
                <span className='d-block font-weight-semibold'>{row.contact_email}</span>
            </div>
        </div> 
      )
    },
    sortable: true,
    hide: 1439,
  },
  {
    name: 'Action',
    minWidth: '210px',
    button: true,
    cell: row => renderCompanyActions(row, handleUpdateRowClick, handleDeleteRow),
  },
];

export default borrowerCompaniesCol