"use client";

import React, { useState } from 'react';
import { CornerUpLeft } from 'react-feather';
// import BorrowerDetails from './TabForm/BorrowerDetails'
// import BorrowerAttachments from './TabForm/BorrowerAttachments'
// import BorrowerCoMaker from './TabForm/BorrowerCoMaker'
import PerPayments from './PerPayments'
import { BorrowerRowInfo, DataChief, DataArea, DataSubArea, DataBorrCompanies } from '@/utils/DataTypes'
interface CollectionListProps {
  setShowForm: (v: boolean) => void;
}

const CollectionListInfo: React.FC<CollectionListProps> = ({ setShowForm }) => {
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
                activeTab === 'tab2' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-500'
              }`}
              onClick={() => handleTabClick('tab2')}
            >
              Per Payments
            </button>
            <button
              className={`p-4 focus:outline-none border-b-2 ${
                activeTab === 'tab3' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-500'
              }`}
              onClick={() => handleTabClick('tab3')}
            >
              Legal Accounts
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'tab1' && (
              <div id="content1">
              </div>
            )}
            {activeTab === 'tab2' && (
              <div id="content2">
                <PerPayments collectionList={[]} />
              </div>
            )}
            {activeTab === 'tab3' && (
              <div id="content3">
                <h2 className="text-xl font-semibold text-gray-800">Under Development..</h2>
                {/* <p className="mt-2 text-gray-600">This is the content of the third tab. Tailwind CSS makes styling easy!</p> */}
              </div>
            )}
            {activeTab === 'tab4' && (
              <div id="content4">
                {/* <h2 className="text-xl font-semibold text-gray-800">Under Development..</h2> */}
                {/* <p className="mt-2 text-gray-600">This is the content of the third tab. Tailwind CSS makes styling easy!</p> */}
                {/* <BorrowerCoMaker singleData={singleData} /> */}
              </div>
            )}
            {activeTab === 'tab5' && (
              <div id="content5">
                {/* <p className="mt-2 text-gray-600">This is the content of the third tab. Tailwind CSS makes styling easy!</p> */}
                {/* <BorrowerAttachments singleData={singleData} /> */}
              </div>
            )}
            {activeTab === 'tab6' && (
              <div id="content6">
                <h2 className="text-xl font-semibold text-gray-800">Under Development..</h2>
                {/* <p className="mt-2 text-gray-600">This is the content of the third tab. Tailwind CSS makes styling easy!</p> */}
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default CollectionListInfo;