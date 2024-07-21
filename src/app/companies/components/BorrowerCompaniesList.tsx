"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import borrowerCompaniesCol from './BorrowerCompaniesColumn';
// import subBranchListCol from './SubBranchListColumn';
import { DataBranches, DataFormBranch, DataSubBranches, DataBorrCompanies } from '@/utils/DataTypes';
import BorrCompForm from './BorrCompForm';
// import FormAddSubBranch from './FormAddSubBranch';
// import { useBranchListsStore } from '../hooks/store';
import useBorrCompanies from '@/hooks/useBorrCompanies';
import { GitBranch, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';

const column = borrowerCompaniesCol;
// const subcolumn = subBranchListCol;

const BorrowerCompaniesList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showSubForm, setShowSubForm] = useState<boolean>(false);
  const [showSubBranch, setShowSubBranch] = useState<boolean>(false);
  // const { selectedRow } = useBranchListsStore.getState();
  const { dataBorrComp, fetchDataBorrComp, handleDeleteBranch } = useBorrCompanies();
  
  const [initialFormData, setInitialFormData] = useState<DataBorrCompanies | null>(null);
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

  const handleUpdateRowClick = (row: DataBorrCompanies) => {
    handleShowForm('Update Borrower Companies', true)
    setInitialFormData(row);
    setShowSubForm(false);
  };

  const handleDeleteRow = async (row: DataBorrCompanies) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      handleDeleteBranch(row);
      fetchDataBorrComp(10, 1);
    }
  }

  useEffect(() => {
  }, [dataBorrComp])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
        {!showSubBranch && (
          <div className={`col-span-2 ${!showSubBranch ? 'fade-in' : 'fade-out'}`}>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Companies
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 flex items-center space-x-2" onClick={() => handleShowForm('Create Borrower Companies', true)}>
                  <GitBranch  size={14} /> 
                  <span>Create</span>
                </button>
                <CustomDatatable
                  apiLoading={false}
                  title="Branch List"
                  columns={column(handleUpdateRowClick, handleDeleteRow)}
                  data={dataBorrComp || []}
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
                  <BorrCompForm setShowForm={setShowForm} fetchDataBorrComp={fetchDataBorrComp} initialData={initialFormData} actionLbl={actionLbl} />
                </div>
              </div>
            </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default BorrowerCompaniesList;