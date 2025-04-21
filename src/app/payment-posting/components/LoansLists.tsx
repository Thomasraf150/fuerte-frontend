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
  const { loanData, fetchLoanSchedule, loanScheduleList, fetchLoans, loading, onSubmitCollectionPayment, onSubmitOthCollectionPayment, fnReversePayment } = usePaymentPosting();

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
    fetchLoans(2000, 1, 0);
  }

  useEffect(() => {
    fetchLoans(2000, 1, 0);
  }, [loanScheduleList])

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
                    apiLoading={loading}
                    columns={column(handleRowClick)}
                    onRowClicked={handleWholeRowClick}
                    data={loanData}
                    enableCustomHeader={true} 
                    title={''}  
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