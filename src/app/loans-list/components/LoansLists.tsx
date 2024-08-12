"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import loansListColumn from './LoansListColumn';
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import useLoans from '@/hooks/useLoans';
import LoanPnSigningForm from './LoanPnSigningForm';

const column = loansListColumn;

const LoansLists: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [actionLbl, setActionLbl] = useState<string>('');
  const [singleData, setSingleData] = useState<BorrLoanRowData>();
  const { loanData, fetchLoans } = useLoans();


  const handleCreateLoanProduct = () => {
    setShowForm(true);
    setSingleData(undefined);
    setActionLbl('Create Borrower');
  }

  const handleRowClick = (data: BorrLoanRowData) => {
    setShowForm(true);
    setSingleData(data);
    setActionLbl('Update Borrower');
  }
 
  const handleWholeRowClick = (data: BorrLoanRowData) => {
    setShowForm(true);
    setSingleData(data);
    // setActionLbl('Update Borrower');
    console.log(data, ' data');

  }

  useEffect(() => {
    fetchLoans(1000, 1, 0);
  }, [])

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
                    {/* <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={handleCreateLoanProduct}>Create</button> */}
                    <CustomDatatable
                      apiLoading={false}
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
                <LoanPnSigningForm singleData={singleData} setShowForm={setShowForm} />
              </div>
            )}
            
          </div>
        </div>
      </div>

        
    </div>
  );
};

export default LoansLists;