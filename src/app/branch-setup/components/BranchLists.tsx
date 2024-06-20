"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import branchListCol from './BranchListColumn';
import { DataRow } from '@/utils/DataTypes';
import FormAddBranch from './FormAddBranch';
import FormAddSubBranch from './FormAddSubBranch';
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

const column = branchListCol;

const BranchLists: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showSubForm, setShowSubForm] = useState<boolean>(false);
  const [showSubBranch, setShowSubBranch] = useState<boolean>(false);
  const { selectedRow } = useBranchListsStore.getState();

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl)
  }
  
  const handleShowSubForm = (lbl: string, showFrm: boolean) => {
    setShowSubForm(showFrm);
    setActionLbl(lbl)
  }

  const handleRowBranch = (row: DataRow) => {
    console.log(row, ' rowrowrow');
    handleShowForm('Update Branch', true)
  };
 
  const handleRowSubBranch = (row: DataRow) => {
    console.log(row, ' rowrowrow');
    handleShowSubForm('Update Branch', true)
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Main Branch
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

          {showSubBranch && (
            <div className="col-span-2">
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    Sub Branch
                  </h3>
                </div>
                <div className="p-7">
                  <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={() => handleShowSubForm('Create Branch', true)}>Create</button>
                  <CustomDatatable
                    apiLoading={false}
                    title="Branch List"
                    columns={column(handleRowSubBranch)}
                    data={data}
                  />
                </div>
              </div>
            </div>
          )}

          {showForm && (
            <div className="fade-in">
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    {actionLbl}
                  </h3>
                </div>
                <div className="p-7">
                  <FormAddBranch setShowForm={setShowForm} />
                </div>
              </div>
            </div>
          )}
          
          {showSubForm && (
            <div className="fade-in">
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    {actionLbl}
                  </h3>
                </div>
                <div className="p-7">
                  <FormAddSubBranch setShowForm={setShowSubForm} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchLists;