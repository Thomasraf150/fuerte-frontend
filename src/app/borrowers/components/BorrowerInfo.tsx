



"use client";

import React, { useState } from 'react';
import { CornerUpLeft } from 'react-feather';
import BorrowerDetails from './TabForm/BorrowerDetails'

const BorrowerInfo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('tab1');

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  return (
    <div>
        <button
          className="flex justify-center rounded border bg-white border-stroke px-6 py-4 mb-4 space-x-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
        >
         <CornerUpLeft size={15} /> 
        </button>
        <div className="max-w-12xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4">
            <h5 className="text-lg font-medium text-black dark:text-white">
              Task title
            </h5>
          </div>
          <div className="flex justify-around border-b">
            <button
              className={`p-4 focus:outline-none border-b-2 ${
                activeTab === 'tab1' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-500'
              }`}
              onClick={() => handleTabClick('tab1')}
            >
              Details
            </button>
            <button
              className={`p-4 focus:outline-none border-b-2 ${
                activeTab === 'tab2' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-500'
              }`}
              onClick={() => handleTabClick('tab2')}
            >
              Status
            </button>
            <button
              className={`p-4 focus:outline-none border-b-2 ${
                activeTab === 'tab3' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-500'
              }`}
              onClick={() => handleTabClick('tab3')}
            >
              Character References
            </button>
            <button
              className={`p-4 focus:outline-none border-b-2 ${
                activeTab === 'tab4' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-500'
              }`}
              onClick={() => handleTabClick('tab4')}
            >
              Co-Maker
            </button>
            <button
              className={`p-4 focus:outline-none border-b-2 ${
                activeTab === 'tab5' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-500'
              }`}
              onClick={() => handleTabClick('tab5')}
            >
              Attachments
            </button>
            <button
              className={`p-4 focus:outline-none border-b-2 ${
                activeTab === 'tab6' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-500'
              }`}
              onClick={() => handleTabClick('tab6')}
            >
              Loans
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'tab1' && (
              <div id="content1">
                <BorrowerDetails />
              </div>
            )}
            {activeTab === 'tab2' && (
              <div id="content2">
                <h2 className="text-xl font-semibold text-gray-800">Content for Tab 2</h2>
                <p className="mt-2 text-gray-600">This is the content of the second tab. Feel free to customize it as needed.</p>
              </div>
            )}
            {activeTab === 'tab3' && (
              <div id="content3">
                <h2 className="text-xl font-semibold text-gray-800">Content for Tab 3</h2>
                <p className="mt-2 text-gray-600">This is the content of the third tab. Tailwind CSS makes styling easy!</p>
              </div>
            )}
            {activeTab === 'tab4' && (
              <div id="content3">
                <h2 className="text-xl font-semibold text-gray-800">Content for Tab 3</h2>
                <p className="mt-2 text-gray-600">This is the content of the third tab. Tailwind CSS makes styling easy!</p>
              </div>
            )}
            {activeTab === 'tab5' && (
              <div id="content3">
                <h2 className="text-xl font-semibold text-gray-800">Content for Tab 3</h2>
                <p className="mt-2 text-gray-600">This is the content of the third tab. Tailwind CSS makes styling easy!</p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default BorrowerInfo;