"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import loanTypeListColumn from './LoanTypeListColumn';
import LoanTypeForm from './LoanTypeForm';
import useLoanTypes from '@/hooks/useLoanTypes';
import { DataRowLoanTypeList, DataFormLoanType } from '@/utils/DataTypes';
import { showConfirmationModal } from '@/components/ConfirmationModal';

const LoanTypeList: React.FC = () => {
  const {
    dataLoanTypes,
    loading,
    submitting,
    fetchLoanTypes,
    onSubmitLoanType,
    handleDeleteLoanType,
  } = useLoanTypes();

  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<DataRowLoanTypeList | null>(null);

  useEffect(() => {
    fetchLoanTypes();
  }, [fetchLoanTypes]);

  const handleCreate = () => {
    setEditData(null);
    setShowForm(true);
  };

  const handleEdit = (row: DataRowLoanTypeList) => {
    setEditData(row);
    setShowForm(true);
  };

  const handleDelete = async (row: DataRowLoanTypeList) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'This loan type will be removed.',
      'Yes, delete it!',
    );
    if (isConfirmed) {
      await handleDeleteLoanType(row.id);
    }
  };

  const handleFormSubmit = async (data: DataFormLoanType) => {
    const result = await onSubmitLoanType(data);
    if (result.success) {
      setShowForm(false);
      setEditData(null);
    }
    return result;
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditData(null);
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className={`grid ${showForm ? 'grid-cols-5' : 'grid-cols-1'} gap-4`}>
          <div className={showForm ? 'col-span-3' : ''}>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Loan Types
                </h3>
              </div>
              <div className="p-7">
                <button
                  className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800"
                  onClick={handleCreate}
                >
                  Create
                </button>
                <CustomDatatable
                  apiLoading={loading}
                  title=""
                  columns={loanTypeListColumn(handleEdit, handleDelete)}
                  enableCustomHeader={true}
                  data={dataLoanTypes}
                />
              </div>
            </div>
          </div>

          {showForm && (
            <div className="col-span-2">
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    {editData ? 'Update Loan Type' : 'Create Loan Type'}
                  </h3>
                </div>
                <div className="p-7">
                  <LoanTypeForm
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancel}
                    initialData={editData}
                    submitting={submitting}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanTypeList;
