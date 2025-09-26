"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import chiefListCol from './ChiefListColumn';
import { DataChief } from '@/utils/DataTypes';
import ChiefForm from './ChiefForm';
import useChiefs from '@/hooks/useChiefs';
import { GitBranch, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';

const column = chiefListCol;

const ChiefList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showSubForm, setShowSubForm] = useState<boolean>(false);
  const [showSubBranch, setShowSubBranch] = useState<boolean>(false);
  // const { selectedRow } = useBranchListsStore.getState();
  const { dataChief, fetchDataChief, handleDeleteChief, chiefFetchLoading } = useChiefs();
  
  const [initialFormData, setInitialFormData] = useState<DataChief | null>(null);

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
    setShowSubForm(false);
  }
  
  const handleShowSubForm = (lbl: string, showFrm: boolean) => {
    setShowSubForm(showFrm);
    setActionLbl(lbl)
  }

  const handleUpdateRowClick = (row: DataChief) => {
    handleShowForm('Update Chief', true)
    setInitialFormData(row);
    setShowSubForm(false);
  };

  const handleDeleteRow = async (row: DataChief) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      handleDeleteChief(row);
      fetchDataChief(10, 1);
    }
  }

  useEffect(() => {
  }, [dataChief])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
        {!showSubBranch && (
          <div className={`col-span-2 ${!showSubBranch ? 'fade-in' : 'fade-out'}`}>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Chiefs
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 flex items-center space-x-2" onClick={() => handleShowForm('Create Chief', true)}>
                  <GitBranch  size={14} /> 
                  <span>Create</span>
                </button>
                <CustomDatatable
                  apiLoading={chiefFetchLoading}
                  title="Branch List"
                  columns={column(handleUpdateRowClick, handleDeleteRow)}
                  data={dataChief || []}
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
                  <ChiefForm setShowForm={setShowForm} fetchDataChief={fetchDataChief} initialData={initialFormData} actionLbl={actionLbl} />
                </div>
              </div>
            </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default ChiefList;