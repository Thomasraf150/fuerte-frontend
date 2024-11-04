"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import soaListColumn from './SoaListColumn';
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import useLoans from '@/hooks/useLoans';
import SoaDetails from './SoaDetails';

const column = soaListColumn;

const SoaList: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [singleData, setSingleData] = useState<BorrLoanRowData>();
  const { loanData, fetchLoans, loading } = useLoans();

  const handleRowClick = (data: BorrLoanRowData) => {
    setShowForm(true);
    setSingleData(data);
  }
 
  const handleWholeRowClick = (data: BorrLoanRowData) => {
    setShowForm(true);
    setSingleData(data);
  }

  const handleShowForm = (d: boolean) => {
    setShowForm(d);
    fetchLoans(1000, 1, 0);
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
                    Statement of Account
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
                <>
                  <SoaDetails setShowForm={setShowForm} singleData={singleData}/>
                </>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoaList;