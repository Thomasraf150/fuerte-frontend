"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import branchListCol from './BranchListColumn';
import subBranchListCol from './SubBranchListColumn';
import { DataBranches, DataFormBranch, DataSubBranches } from '@/utils/DataTypes';
import FormAddBranch from './FormAddBranch';
import FormAddSubBranch from './FormAddSubBranch';
import { useBranchListsStore } from '../hooks/store';
import useBranches from '@/hooks/useBranches';
import { GitBranch, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';

const column = branchListCol;
const subcolumn = subBranchListCol;

const BranchLists: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showSubForm, setShowSubForm] = useState<boolean>(false);
  const [showSubBranch, setShowSubBranch] = useState<boolean>(false);
  const { selectedRow } = useBranchListsStore.getState();
  const { dataBranch, dataBranchSub, selectedBranchID, fetchDataList, fetchSubDataList, handleDeleteBranch, handleDeleteSubBranch } = useBranches();
  const [initialFormData, setInitialFormData] = useState<DataBranches | null>(null);
  const [initialFormSubData, setInitialFormSubData] = useState<DataSubBranches | null>(null);

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
    setShowSubForm(false);
  }
  
  const handleShowSubForm = (lbl: string, showFrm: boolean) => {
    setShowSubForm(showFrm);
    setActionLbl(lbl)
  }

  const handleUpdateRowClick = (row: DataBranches) => {
    handleShowForm('Update Branch', true)
    setInitialFormData(row);
    setShowSubForm(false);
  };
  
  const handleSubViewRowClick = (id: number) => {
    console.log('View Subs');
    setShowSubBranch(true);
    fetchSubDataList('id_desc', id);
  };

  const handleUpdateSubRowClick = (row: DataSubBranches) => {
    handleShowSubForm('Update Sub Branch', true)
    setShowForm(false);
    setInitialFormSubData(row);
  };

  const handleCreateSubRowClick = () => {
    handleShowSubForm('Create Sub Branch', true)
    setInitialFormSubData(null);
    setShowForm(false);
  };

  const handleDeleteRow = async (id: number) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      handleDeleteBranch(id);
      fetchDataList();  
    }
  }
  
  const handleDeleteSubRow = async (row: DataSubBranches) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      handleDeleteSubBranch(Number(row?.id));
      fetchSubDataList('id_desc', row?.branch_id);
    }
  }

  useEffect(() => {
  }, [dataBranch, dataBranchSub, initialFormData, selectedBranchID])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
        {!showSubBranch && (
          <div className={`col-span-2 ${!showSubBranch ? 'fade-in' : 'fade-out'}`}>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Main Branch
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 flex items-center space-x-2" onClick={() => handleShowForm('Create Branch', true)}>
                  <GitBranch  size={14} /> 
                  <span>Create</span>
                </button>
                <CustomDatatable
                  apiLoading={false}
                  title="Branch List"
                  columns={column(handleUpdateRowClick, handleSubViewRowClick, handleDeleteRow)}
                  data={dataBranch || []}
                />
              </div>
            </div>
          </div>
        )}

          {showSubBranch && (
            <div className={`col-span-2 ${showSubBranch ? 'fade-in' : 'fade-out'}`}>
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    {dataBranchSub && dataBranchSub[0]?.branch?.name}
                  </h3>
                </div>
                <div className="p-7">
                  <div className="flex items-center space-x-2">
                    <button 
                      className="bg-rose-600 text-white py-2 px-4 rounded hover:bg-rose-800 flex items-center space-x-2" onClick={() => 
                      {
                        setShowSubBranch(false)
                        setShowSubForm(false)
                      } 
                      }>
                      <SkipBack size={15} /> 
                      <span>Back</span>
                    </button>
                    <button 
                      className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 flex items-center space-x-2" 
                      onClick={() => handleCreateSubRowClick() }>
                      <GitBranch  size={14} /> 
                      <span>Create</span>
                    </button>
                  </div>
                  <CustomDatatable
                    apiLoading={false}
                    title="Branch List"
                    columns={subcolumn(handleUpdateSubRowClick, handleDeleteSubRow)}
                    data={dataBranchSub || []}
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
                  <FormAddBranch setShowForm={setShowForm} fetchDataList={fetchDataList} initialData={initialFormData} actionLbl={actionLbl} />
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
                  <FormAddSubBranch setShowForm={setShowSubForm} selectedBranchId={selectedBranchID ?? 0} initialSubData={initialFormSubData} actionLbl={actionLbl} fetchSubDataList={fetchSubDataList}/>
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