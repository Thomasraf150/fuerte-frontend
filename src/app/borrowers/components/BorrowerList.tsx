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
      fetchDataBorrower,
      fetchDataChief,
      fetchDataArea,
      fetchDataBorrCompany,
      fetchDataSubArea } = useBorrower();

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

  useEffect(() => {
    fetchDataBorrower(3000, 1);
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
                      Borrowers
                    </h3>
                  </div>
                  <div className="p-7">
                    <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={handleCreateLoanProduct}>Create</button>
                    <CustomDatatable
                      apiLoading={borrowerLoading}
                      columns={column(handleRowClick)}
                      data={dataBorrower}
                      enableCustomHeader={true} 
                      title={''}  
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