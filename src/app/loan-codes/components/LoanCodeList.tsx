"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import loanCodeListColumn from './LoanCodeListColumn';
import FormAddLoanCode from './FormAddLoanCode';
import { DataRowLoanCodes } from '@/utils/DataTypes';
import useLoanCodes from '@/hooks/useLoanCodes';


const column = loanCodeListColumn;

const LoanCodeList: React.FC = () => {

  const [showForm, setShowForm] = useState<boolean>(false);
  const [actionLbl, setActionLbl] = useState<string>('');
  const [singleUserData, setSingleUserData] = useState<DataRowLoanCodes>();

  const { 
    data, 
    allLoanCodesData, 
    currentPage, 
    totalPages, 
    totalRecords, 
    hasNextPage, 
    loading, 
    prefetching, 
    navigateToPage, 
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

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Loan Code
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={()=>{ handleCreateLoanCode('Create Loan Code', true); }}>Create</button>
                <CustomDatatable
                  apiLoading={loading}
                  title={``}
                  columns={column(handleRowClick)}
                  enableCustomHeader={true} 
                  data={allLoanCodesData}
                  smartPagination={{
                    hasNextPage,
                    totalRecords,
                    onLoadMore: () => navigateToPage(currentPage + 1),
                    isLoadingMore: prefetching
                  }}
                />
              </div>
            </div>
          </div>

          {showForm && (
            <div className={`${showForm ? 'fade-in' : 'fade-out'}`}>
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    {actionLbl}
                  </h3>
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