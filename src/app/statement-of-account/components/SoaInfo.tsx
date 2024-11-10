"use client";

import React, { useState } from 'react';
import { CornerUpLeft } from 'react-feather';
// import BorrowerDetails from './TabForm/BorrowerDetails'
// import BorrowerAttachments from './TabForm/BorrowerAttachments'
// import BorrowerCoMaker from './TabForm/BorrowerCoMaker'
// import BorrowerLoans from './TabForm/BorrowerLoans'
import { BorrowerRowInfo } from '@/utils/DataTypes'
interface BorrInfoProps {
  setShowForm: (v: boolean) => void;
  // singleData?: BorrowerRowInfo | undefined;
  // fetchDataBorrower: (v1: number, v2: number) => void;
}

const SoaInfo: React.FC<BorrInfoProps> = ({ setShowForm }) => {
  const [activeTab, setActiveTab] = useState<string>('tab1');
  const [showBorrAttForm, setShowBorrAttForm] = useState<boolean>(false);

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  return (
    <div>
        <button
          className="flex justify-center rounded border bg-white border-stroke px-6 py-4 mb-4 space-x-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
          onClick={() => { setShowForm(false) }}
        >
         <CornerUpLeft size={15} /> 
        </button>
        <div className="max-w-12xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          {/* <div className="p-4">
            <h5 className="text-lg font-medium text-black dark:text-white">
              Task title
            </h5>
          </div> */}
          <div className="flex justify-around border-b">
            <button
              className={`p-4 focus:outline-none border-b-2 ${
                activeTab === 'tab1' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-500'
              }`}
              onClick={() => handleTabClick('tab1')}
            >
              Customer Loans
            </button>
            <button
              className={`p-4 focus:outline-none border-b-2 ${
                activeTab === 'tab2' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-500'
              }`}
              onClick={() => handleTabClick('tab2')}
            >
              Customer
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'tab1' && (
              <div id="content1">
                {/* <BorrowerDetails singleData={singleData} setShowForm={setShowForm} fetchDataBorrower={fetchDataBorrower} /> */}
                1
              </div>
            )}
            {activeTab === 'tab2' && (
              <div id="content2">
                {/* <BorrowerLoans singleData={singleData} /> */}
                2
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default SoaInfo;