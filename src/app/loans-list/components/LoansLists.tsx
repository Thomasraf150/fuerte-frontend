"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import loansListColumn from './LoansListColumn';
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import useLoans from '@/hooks/useLoans';
import LoanPnSigningForm from './LoanPnSigningForm';
import { showConfirmationModal } from '@/components/ConfirmationModal';

const column = loansListColumn;

const LoansLists: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [singleData, setSingleData] = useState<BorrLoanRowData>();
  const {
    dataLoans,
    loansLoading,
    serverSidePaginationProps,
    handleDeleteLoans,
    refreshLoans
  } = useLoans();

  const handleRowClick = async (data: BorrLoanRowData) => {
    setSingleData(data);
    handleDeleteLoans(String(data.id), 'rm_loans');
  }
 
  const handleViewWholeLoan = (data: BorrLoanRowData) => {
    setShowForm(true);
    setSingleData(data);
    console.log(data, ' data');
  }

  const handleShowForm = (d: boolean) => {
    setShowForm(d);
    refreshLoans();
  }

  // Note: Removed useEffect - usePagination handles initial data loading

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">

            {showForm === false ? (
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    Loans List
                  </h3>
                </div>
                <div className="p-7">
                  <CustomDatatable
                    apiLoading={loansLoading}
                    columns={column(handleRowClick, handleViewWholeLoan)}
                    // onRowClicked={handleViewWholeLoan}
                    data={dataLoans}
                    serverSidePagination={serverSidePaginationProps}
                    enableCustomHeader={true}
                    title={''}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <LoanPnSigningForm singleData={singleData} handleShowForm={handleShowForm} />
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoansLists;