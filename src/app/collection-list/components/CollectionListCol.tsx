"use client";

import { TableColumn } from 'react-data-table-component';
import { Eye, Edit3, Trash2 } from 'react-feather';
import Tooltip from '@/components/Tooltip';
import { DataRowCollectionList } from '@/utils/DataTypes';

const collectionListCol = (handleRowClick: (row: DataRowCollectionList) => void): TableColumn<DataRowCollectionList>[] => [
  {
    name: 'Date Paid',
    cell: row => row.date_paid,
    sortable: true,
    style: {
      minWidth: '150px',
    },
    width: '150px'
  },
  {
    name: 'Action',
    cell: row => (<></>),
    sortable: true,
    style: {
      minWidth: '520px',
    },
    width: '100px'
  },
  // {
  //   name: 'Loan Description',
  //   cell: row => row.description,
  //   sortable: true,
  //   style: {
  //     minWidth: '220px',
  //   },
  //   width: '220px'
  // },
  {
    name: 'Ref #',
    cell: row => row.refno,
    sortable: true,
  },
  {
    name: 'Borrower Name',
    cell: row => row.borrower,
    sortable: true,
  },
  {
    name: 'Monthly Amort.',
    cell: row => row.monthly,
    sortable: true,
  },
  {
    name: 'Collection',
    cell: row => row.collection,
    sortable: true,
  },
  {
    name: 'Rebates',
    cell: row => row.rebates,
    sortable: true,
  },
  {
    name: 'UA/SP',
    cell: row => row.ua_sp,
    sortable: true,
  },
  {
    name: 'Payment UA/SP',
    cell: row => row.payment_ua_sp,
    sortable: true,
  },
  {
    name: 'Advance Payment',
    cell: row => row.advance_payment,
    sortable: true,
  },
  {
    name: 'Bank Charge',
    cell: row => row.bank_charge,
    sortable: true,
  },
  {
    name: 'AP Refund',
    cell: row => row.ap_or_refund,
    sortable: true,
  },

];

export default collectionListCol