"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import auditLogListCol from './AuditLogListColumn';
import { DataArea } from '@/utils/DataTypes';
import AuditLogForm from './AuditLogForm';
import useArea from '@/hooks/useArea';
import { GitBranch, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';

const column = auditLogListCol;

const AuditLogList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showSubForm, setShowSubForm] = useState<boolean>(false);
  const [showSubBranch, setShowSubBranch] = useState<boolean>(false);
  // const { selectedRow } = useBranchListsStore.getState();
  const { dataArea, refresh, handleDeleteArea } = useArea();
  
  const [initialFormData, setInitialFormData] = useState<DataArea | null>(null);

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
    setShowSubForm(false);
  }
  
  const handleShowSubForm = (lbl: string, showFrm: boolean) => {
    setShowSubForm(showFrm);
    setActionLbl(lbl)
  }

  const handleUpdateRowClick = (row: DataArea) => {
    handleShowForm('Update Area', true)
    setInitialFormData(row);
    setShowSubForm(false);
  };

  const handleDeleteRow = async (row: DataArea) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      handleDeleteArea(row);
      refresh();
    }
  }

  useEffect(() => {
  }, [dataArea])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
        {!showSubBranch && (
          <div className={`col-span-2 ${!showSubBranch ? 'fade-in' : 'fade-out'}`}>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Audit Logs
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 flex items-center space-x-2" onClick={() => handleShowForm('Create Area', true)}>
                  <GitBranch  size={14} /> 
                  <span>Create</span>
                </button>
                <CustomDatatable
                  apiLoading={false}
                  title="Area List"
                  columns={column(handleUpdateRowClick, handleDeleteRow)}
                  data={dataArea || []}
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
                  <AuditLogForm setShowForm={setShowForm} fetchDataArea={refresh} initialData={initialFormData} actionLbl={actionLbl} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuditLogList;