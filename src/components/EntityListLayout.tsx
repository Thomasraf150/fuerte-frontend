"use client";

import React, { useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import { TableColumn } from 'react-data-table-component';
import { GitBranch, X } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';

interface EntityListLayoutProps<T> {
  title: string;
  entityName: string;
  data: T[];
  columns: (
    onEdit: (row: T) => void,
    onDelete: (row: T) => void
  ) => TableColumn<T>[];
  loading: boolean;
  error: string | null;
  serverSidePagination: any;
  refresh: () => Promise<void>;
  onDelete: (row: T) => Promise<void>;
  FormComponent: React.FC<{
    setShowForm: (value: boolean) => void;
    refresh: () => Promise<void>;
    initialData: T | null;
    actionLbl: string;
  }>;
}

function EntityListLayout<T>({
  title,
  entityName,
  data,
  columns,
  loading,
  error,
  serverSidePagination,
  refresh,
  onDelete,
  FormComponent,
}: EntityListLayoutProps<T>) {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [initialFormData, setInitialFormData] = useState<T | null>(null);

  const handleShowForm = (lbl: string) => {
    setShowForm(true);
    setActionLbl(lbl);
  };

  const handleUpdateRowClick = (row: T) => {
    handleShowForm(`Update ${entityName}`);
    setInitialFormData(row);
  };

  const handleDeleteRow = async (row: T) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      await onDelete(row);
      refresh();
    }
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  {title}
                </h3>
              </div>
              <div className="p-7">
                <button
                  className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 flex items-center space-x-2"
                  onClick={() => handleShowForm(`Create ${entityName}`)}
                >
                  <GitBranch size={14} />
                  <span>Create</span>
                </button>
                {error && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    Error loading {title.toLowerCase()}: {error}
                    <button
                      onClick={refresh}
                      className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Retry
                    </button>
                  </div>
                )}
                <CustomDatatable
                  apiLoading={loading}
                  title={`${entityName} List`}
                  columns={columns(handleUpdateRowClick, handleDeleteRow)}
                  data={data}
                  serverSidePagination={serverSidePagination}
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
                  <FormComponent
                    setShowForm={setShowForm}
                    refresh={refresh}
                    initialData={initialFormData}
                    actionLbl={actionLbl}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default EntityListLayout;
