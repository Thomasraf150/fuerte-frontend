"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import bankListCol from './BankListColumn';
import { DataBank } from '@/utils/DataTypes';
import BankForm from './BankForm';
import useBank from '@/hooks/useBank';
import { GitBranch, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';

const column = bankListCol;

const BankList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showSubForm, setShowSubForm] = useState<boolean>(false);
  const [showSubBranch, setShowSubBranch] = useState<boolean>(false);
  // const { selectedRow } = useBranchListsStore.getState();
  const { dataBank, fetchDataBank, handleDeleteBank, loading } = useBank();
  
  const [initialFormData, setInitialFormData] = useState<DataBank | null>(null);

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
    setShowSubForm(false);
  }
  
  const handleShowSubForm = (lbl: string, showFrm: boolean) => {
    setShowSubForm(showFrm);
    setActionLbl(lbl)
  }

  const handleUpdateRowClick = (row: DataBank) => {
    handleShowForm('Update Bank', true)
    setInitialFormData(row);
    setShowSubForm(false);
  };

  const handleDeleteRow = async (row: DataBank) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      handleDeleteBank(row);
      fetchDataBank(10, 1);
    }
  }

  useEffect(() => {
  }, [dataBank])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
        {!showSubBranch && (
          <div className={`col-span-2 ${!showSubBranch ? 'fade-in' : 'fade-out'}`}>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Banks
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 flex items-center space-x-2" onClick={() => handleShowForm('Create Bank', true)}>
                  <GitBranch  size={14} /> 
                  <span>Create</span>
                </button>
                <CustomDatatable
                  apiLoading={loading}
                  title="Bank List"
                  columns={column(handleUpdateRowClick, handleDeleteRow)}
                  data={dataBank || []}
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
                  <BankForm setShowForm={setShowForm} fetchDataBank={fetchDataBank} initialData={initialFormData} actionLbl={actionLbl} />
                </div>
              </div>
            </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default BankList;