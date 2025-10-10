"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import subAreaListCol from './SubAreaListColumn';
import { DataArea, DataSubArea } from '@/utils/DataTypes';
import SubAreaForm from './SubAreaForm';
import useSubArea from '@/hooks/useSubArea';
import { GitBranch, SkipBack, X } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';

const column = subAreaListCol;

const SubAreaList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showSubForm, setShowSubForm] = useState<boolean>(false);
  const [showSubBranch, setShowSubBranch] = useState<boolean>(false);
  // const { selectedRow } = useBranchListsStore.getState();
  const { fetchDataArea,
          dataArea,
          fetchDataSubArea,
          dataSubArea,
          onSubmitSubArea,
          handleDeleteSubArea,
          subAreaFetchLoading } = useSubArea();
  
  const [initialFormData, setInitialFormData] = useState<DataSubArea | null>(null);

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
    setShowSubForm(false);
  }
  
  const handleShowSubForm = (lbl: string, showFrm: boolean) => {
    setShowSubForm(showFrm);
    setActionLbl(lbl)
  }

  const handleUpdateRowClick = (row: DataSubArea) => {
    handleShowForm('Update Sub Area', true)
    setInitialFormData(row);
    setShowSubForm(false);
  };

  const handleDeleteRow = async (row: DataSubArea) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      handleDeleteSubArea(row);
      fetchDataArea(10, 1);
    }
  }

  useEffect(() => {
  }, [dataArea])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">


          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Sub Areas
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 flex items-center space-x-2" onClick={() => handleShowForm('Create Sub Area', true)}>
                  <GitBranch  size={14} />
                  <span>Create</span>
                </button>
                <CustomDatatable
                  apiLoading={subAreaFetchLoading}
                  title="Sub Area List"
                  columns={column(handleUpdateRowClick, handleDeleteRow)}
                  data={dataSubArea || []}
                />
              </div>
            </div>
          </div>

          {showForm && (
            <div className="fade-in col-span-1">
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark flex justify-between items-center">
                  <h3 className="font-medium text-black dark:text-white">
                    {actionLbl}
                  </h3>
                  <span className="text-right cursor-pointer text-boxdark-2 lg:hidden" onClick={() => setShowForm(false)}>
                    <X size={17}/>
                  </span>
                </div>
                <div className="p-7">
                  <SubAreaForm setShowForm={setShowForm} fetchDataSubArea={fetchDataSubArea} initialData={initialFormData} actionLbl={actionLbl} />
                </div>
              </div>
            </div>
            )}


        </div>
      </div>
    </div>
  );
};

export default SubAreaList;