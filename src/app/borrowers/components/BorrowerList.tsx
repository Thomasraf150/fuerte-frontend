"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import borrowerColumn from './BorrowerColumn';
import BorrowerInfo from './BorrowerInfo';
import { DataRowLoanProducts, DataFormLoanProducts, BorrowerRowInfo } from '@/utils/DataTypes';
// import FormAddLoanProduct from './FormAddLoanProduct';
import useBorrower from '@/hooks/useBorrower';

const column = borrowerColumn;

const BorrowerList: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [actionLbl, setActionLbl] = useState<string>('');
  const [singleData, setSingleData] = useState<BorrowerRowInfo>();
  const {
      dataBorrower,
      dataChief,
      dataArea,
      dataSubArea,
      dataBorrCompany,
      onSubmitBorrower,
      borrowerLoading,
      paginationLoading,
      fetchDataBorrower,
      fetchDataChief,
      fetchDataArea,
      fetchDataBorrCompany,
      fetchDataSubArea,
      handleRmBorrower,
      // New pagination functionality
      serverSidePaginationProps,
      borrowerError,
      refresh } = useBorrower();

  const handleCreateLoanProduct = () => {
    setShowForm(true);
    setSingleData(undefined);
    setActionLbl('Create Borrower');
  }

  const handleRowClick = (data: BorrowerRowInfo) => {
    setShowForm(true);
    setSingleData(data);
    setActionLbl('Update Borrower');
  }

  const handleRowRmBorrClick = (data: BorrowerRowInfo) => {
    // setShowForm(true);
    setSingleData(data);
    handleRmBorrower(data);
    // setActionLbl('Update Borrower');
  }

  // Note: Pagination hook automatically handles initial data loading
  // No manual useEffect needed for fetching data

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">

            {showForm === false ? (
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                  <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                      Borrowers
                    </h3>
                  </div>
                  <div className="p-7">
                    <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={handleCreateLoanProduct}>Create</button>
                    {borrowerError && (
                      <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        Error loading borrowers: {borrowerError}
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
                      columns={column(handleRowClick, handleRowRmBorrClick)}
                      data={dataBorrower}
                      enableCustomHeader={true}
                      title={''}
                      serverSidePagination={serverSidePaginationProps}
                    />
                  </div>
                </div>
            ) : (
              <BorrowerInfo 
                setShowForm={setShowForm} 
                singleData={singleData} 
                dataChief={dataChief}
                dataArea={dataArea}
                dataSubArea={dataSubArea}
                dataBorrCompany={dataBorrCompany}
                onSubmitBorrower={onSubmitBorrower}
                setSingleData={setSingleData}
                borrowerLoading={borrowerLoading}
                fetchDataBorrower={fetchDataBorrower}
                fetchDataChief={fetchDataChief}
                fetchDataArea={fetchDataArea}
                fetchDataSubArea={fetchDataSubArea}
                fetchDataBorrCompany={fetchDataBorrCompany}
              />
            )}

          </div>
        </div>
      </div>

        
    </div>
  );
};

export default BorrowerList;