"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import AEForm from './AEForm';
import useAdjustingEntries from '@/hooks/useAdjustingEntries';
import { GitBranch, Plus } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { DataLoanProceedList, DataAccBalanceSheet, RowAcctgEntry } from '@/utils/DataTypes';
import aETblColumn from './AETblColumn';

const column = aETblColumn;

const AdjustingEntriesList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const {
    dataAe,
    createAe,
    fetchAe,
    adjustingEntriesLoading,
    paginationLoading,
    serverSidePaginationProps,
    adjustingEntriesError,
    refresh
  } = useAdjustingEntries();
  const [singleData, setSingleData] = useState<RowAcctgEntry>();
  const [showFormAe, setShowFormAe] = useState<boolean>(false);
  
  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }

  const handleShowFormAe = (lbl: string, showFrm: boolean) => {
    setShowFormAe(showFrm);
    setActionLbl(lbl);
    setSingleData(undefined);
  }

  const handleWholeRowClick = (row: RowAcctgEntry) => {
    console.log(row, ' row');
    setSingleData(row);
    setShowFormAe(true);
    setActionLbl('View Adjusting Entries');
  }

  useEffect(() => {

  }, [])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-2 gap-4">
          {!showFormAe && (
            <div className={`col-span-2 ${!showFormAe ?'fade-in' : 'fade-out'}`}>
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-boxdark dark:text-boxdark">
                    Adjusting Entries
                  </h3>
                </div>
                <div className="p-5 flex gap-x-2">  {/* Added flex and gap-x-2 */}
                  <button
                    type="button"
                    className="text-white bg-gradient-to-r items-center from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 flex space-x-2 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                    onClick={ () => handleShowFormAe('Create Adjusting Entries', true) }>
                      <Plus size={14} />
                      <span>New Adjusting Entry</span>
                  </button>
                </div>
                <div className="px-4">
                  {adjustingEntriesError && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                      Error loading adjusting entries: {adjustingEntriesError}
                      <button
                        onClick={refresh}
                        className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  <CustomDatatable
                    apiLoading={paginationLoading}
                    title="AE List"
                    onRowClicked={handleWholeRowClick}
                    columns={column()}
                    data={dataAe || []}
                    enableCustomHeader={true}
                    serverSidePagination={serverSidePaginationProps}
                  />
                </div>
              </div>
            </div>
          )}
          {showFormAe && (
            <div className={`col-span-2 ${showFormAe ?'fade-in' : 'fade-out'}`}>
              <div className="rounded-sm border p-4 px-5 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <AEForm
                  setShowForm={setShowFormAe}
                  actionLbl={actionLbl}
                  singleData={singleData}
                  createAe={createAe}
                  fetchAe={fetchAe}
                  refresh={refresh}
                  loading={adjustingEntriesLoading}
                />
              </div>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default AdjustingEntriesList;