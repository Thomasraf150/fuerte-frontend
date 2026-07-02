"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import chiefListCol from './ChiefListColumn';
import { DataChief } from '@/utils/DataTypes';
import ChiefForm from './ChiefForm';
import useChiefs from '@/hooks/useChiefs';
import { GitBranch, SkipBack, X } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';

const column = chiefListCol;

const ChiefList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showSubForm, setShowSubForm] = useState<boolean>(false);
  const [showSubBranch, setShowSubBranch] = useState<boolean>(false);
  // const { selectedRow } = useBranchListsStore.getState();
  const { dataChief, fetchDataChief, handleDeleteChief, chiefFetchLoading, chiefPaginator } = useChiefs();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const handlePageChange = (p: number) => { setPage(p); fetchDataChief(pageSize, p); };
  const handlePageSizeChange = (s: number) => { setPageSize(s); setPage(1); fetchDataChief(s, 1); };

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
      // Await the delete so the refetch runs after the soft-delete commits.
      await handleDeleteChief(row);
      fetchDataChief(pageSize, page);
    }
  }

  useEffect(() => {
  }, [dataChief])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">


          <div className="col-span-1 md:col-span-1 lg:col-span-2">
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
                  title="Chief List"
                  columns={column(handleUpdateRowClick, handleDeleteRow)}
                  data={dataChief || []}
                  serverSidePagination={{
                    totalRecords: chiefPaginator?.total ?? 0,
                    currentPage: chiefPaginator?.currentPage ?? page,
                    pageSize: chiefPaginator?.perPage ?? pageSize,
                    totalPages: chiefPaginator?.lastPage ?? 1,
                    hasNextPage: chiefPaginator?.hasMorePages ?? false,
                    hasPreviousPage: (chiefPaginator?.currentPage ?? page) > 1,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    recordType: 'chief',
                    recordTypePlural: 'chiefs',
                    enableSearch: false,
                  }}
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