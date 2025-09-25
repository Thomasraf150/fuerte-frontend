"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import loansListColumn from './LoansListColumn';
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import usePaymentPosting from '@/hooks/usePaymentPosting';
// import LoanPnSigningForm from './LoanPnSigningForm';
import PaymentScheduleForm from './PaymentScheduleForm';
import { toast } from "react-toastify";

const column = loansListColumn;

const LoansLists: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [singleData, setSingleData] = useState<BorrLoanRowData>();
  const {
    dataLoans,
    loansLoading,
    loansError,
    serverSidePaginationProps,
    refresh,
    fetchLoanSchedule,
    loanScheduleList,
    onSubmitCollectionPayment,
    onSubmitOthCollectionPayment,
    fnReversePayment
  } = usePaymentPosting();

  const handleRowClick = (data: BorrLoanRowData) => {
    setShowForm(true);
    setSingleData(data);
  }
 
  const handleWholeRowClick = (data: BorrLoanRowData) => {
    if (data?.is_closed === '1') {
      toast.error('This loan is already been closed!');
    } else {
      setShowForm(true);
      fetchLoanSchedule(data?.id);
    }
  }

  const handleShowForm = (d: boolean) => {
    setShowForm(d);
    refresh(); // Use pagination refresh instead of loading 100K records
  }

  // Note: Removed useEffect - usePagination handles initial data loading automatically
  // The component will automatically refresh when needed

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
                  {loansError && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                      Error loading payment posting loans: {loansError}
                      <button
                        onClick={refresh}
                        className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  <CustomDatatable
                    apiLoading={loansLoading}
                    columns={column(handleRowClick)}
                    onRowClicked={handleWholeRowClick}
                    data={dataLoans}
                    enableCustomHeader={true}
                    title={''}
                    serverSidePagination={serverSidePaginationProps}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <PaymentScheduleForm 
                  fnReversePayment={fnReversePayment} 
                  singleData={loanScheduleList} 
                  handleShowForm={handleShowForm} 
                  onSubmitCollectionPayment={onSubmitCollectionPayment} 
                  onSubmitOthCollectionPayment={onSubmitOthCollectionPayment} />
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoansLists;