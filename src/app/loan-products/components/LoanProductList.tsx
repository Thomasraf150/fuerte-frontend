"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import loanProductListColumn from './LoanProductListColumn';
import { DataRowLoanProducts, DataFormLoanProducts } from '@/utils/DataTypes';
import FormAddLoanProduct from './FormAddLoanProduct';
import useLoanProducts from '@/hooks/useLoanProducts';

const column = loanProductListColumn;

const LoanProductList: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [actionLbl, setActionLbl] = useState<string>('');
  const [singleData, setSingleData] = useState<DataRowLoanProducts>();
  const { data, loading, fetchLoanProducts } = useLoanProducts();

  const handleCreateLoanProduct = () => {
    setShowForm(true);
    setSingleData(undefined);
    setActionLbl('Create Loan Product');
  }

  const handleRowClick = (data: DataRowLoanProducts) => {
    setActionLbl('Update Loan Product');
    setShowForm(true);
    setSingleData(data);
  }

  const handleWholeRowClick = (data: DataRowLoanProducts) => {
    console.log(data, ' whole row click tr');
  }

  return (
    <div>
      {showForm === false ? (
        <div className="max-w-12xl">
          <div className="grid grid-cols-1 gap-4">
            <div className="">
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    Loan Product
                  </h3>
                </div>
                <div className="p-7">
                  <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={handleCreateLoanProduct}>Create</button>
                  <CustomDatatable
                    apiLoading={loading}
                    columns={column(handleRowClick)}
                    data={data}
                    enableCustomHeader={true} 
                    onRowClicked={handleWholeRowClick}
                    title={''}  
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl">
          <div className="grid grid-cols-1 gap-4">
            <div className="">
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    {actionLbl}
                  </h3>
                </div>
                <div className="p-7">
                  <FormAddLoanProduct setShowForm={setShowForm} fetchLoanProducts={fetchLoanProducts} singleData={singleData} actionLbl={actionLbl}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanProductList;