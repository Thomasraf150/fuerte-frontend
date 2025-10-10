"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import loanCodeListColumn from './LoanCodeListColumn';
import FormAddLoanCode from './FormAddLoanCode';
import { DataRowLoanCodes } from '@/utils/DataTypes';
import useLoanCodes from '@/hooks/useLoanCodes';
import { X } from 'react-feather';


const column = loanCodeListColumn;

const LoanCodeList: React.FC = () => {

  const [showForm, setShowForm] = useState<boolean>(false);
  const [actionLbl, setActionLbl] = useState<string>('');
  const [singleUserData, setSingleUserData] = useState<DataRowLoanCodes>();

  const {
    dataLoanCodes,
    loanCodesLoading,
    loanCodesError,
    serverSidePaginationProps,
    refresh,
    fetchLoanCodes
  } = useLoanCodes();

  const handleRowClick = (row: DataRowLoanCodes) => {
    setActionLbl('Update Loan Code');
    setShowForm(true);
    setSingleUserData(row)
  }

  const handleCreateLoanCode = (type: string, show: boolean) => {
    setActionLbl(type);
    setShowForm(show);
  }

  const handleWholeRowClick = (data: DataRowLoanCodes) => {
    console.log(data, ' whole row click tr');
  }

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Loan Code
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={()=>{ handleCreateLoanCode('Create Loan Code', true); }}>Create</button>
                {loanCodesError && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    Error loading loan codes: {loanCodesError}
                    <button
                      onClick={refresh}
                      className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Retry
                    </button>
                  </div>
                )}
                <CustomDatatable
                  apiLoading={loanCodesLoading}
                  title={``}
                  columns={column(handleRowClick)}
                  enableCustomHeader={true}
                  data={dataLoanCodes}
                  onRowClicked={handleWholeRowClick}
                  serverSidePagination={serverSidePaginationProps}
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
                  <FormAddLoanCode setShowForm={setShowForm} actionLbl={actionLbl} singleUserData={singleUserData} fetchLoanCodes={refresh}/>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoanCodeList;