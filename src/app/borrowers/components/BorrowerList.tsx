"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import borrowerColumn from './BorrowerColumn';
import BorrowerInfo from './BorrowerInfo';
import { DataRowLoanProducts, DataFormLoanProducts } from '@/utils/DataTypes';
// import FormAddLoanProduct from './FormAddLoanProduct';
import useLoanProducts from '@/hooks/useLoanProducts';

const column = borrowerColumn;

const BorrowerList: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [actionLbl, setActionLbl] = useState<string>('');
  const [singleData, setSingleData] = useState<DataRowLoanProducts>();
  const { data, loading, fetchLoanProducts } = useLoanProducts();

  const handleCreateLoanProduct = () => {
    setShowForm(true);
    setActionLbl('Create Loan Product');
  }

  const handleRowClick = (data: DataRowLoanProducts) => {
    console.log(data);
    setShowForm(true);
    setSingleData(data);
  }

  const [activeTab, setActiveTab] = useState<string>('tab1');

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">

            {showForm === false ? (
              <>
                {/* <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                  <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                      Borrowers
                    </h3>
                  </div>
                  <div className="p-7">
                    <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={handleCreateLoanProduct}>Create</button>
                    <CustomDatatable
                      apiLoading={loading}
                      columns={column(handleRowClick)}
                      data={data}
                      enableCustomHeader={true} 
                      title={''}  
                    />
                  </div>
                </div> */}
              </>
            ) : (
              <></>
            )
              // <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              //   <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
              //     <h3 className="font-medium text-black dark:text-white">
              //       {actionLbl}
              //     </h3>
              //   </div>
              //   <div className="p-7">
              //     <FormAddLoanProduct setShowForm={setShowForm} fetchLoanProducts={fetchLoanProducts} singleData={singleData} actionLbl={actionLbl}/>
              //   </div>
              // </div>
            }

            <BorrowerInfo />


          </div>
        </div>
      </div>

        
    </div>
  );
};

export default BorrowerList;