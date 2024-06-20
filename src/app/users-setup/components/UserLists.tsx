"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import userListCol from './UsersListColumn';
import { DataRow } from '../DataTypes';
import { useBranchListsStore } from '../hooks/store';

const data: DataRow[] = [
  {
    id: 1,
    branch: 'Beetlejuice',
    user: {name: "Dondon"},
  },
  {
    id: 2,
    branch: 'Ghostbusters',
    user: {name: "Pentavia"},
  },
  // Add more rows as needed
];

const column = userListCol;

const UserLists: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const { selectedRow } = useBranchListsStore.getState();

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl)
  }

  const handleRowBranch = (row: DataRow) => {
    console.log(row, ' rowrowrow');
    handleShowForm('Update Branch', true);
  };
 
  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Users
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={() => handleShowForm('Create Branch', true)}>Create</button>
                <CustomDatatable
                  apiLoading={false}
                  title="Branch List"
                  columns={column(handleRowBranch)}
                  data={data}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLists;