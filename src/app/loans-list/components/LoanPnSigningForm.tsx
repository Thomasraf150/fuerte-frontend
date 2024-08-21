"use client";

import React, { useEffect, useState } from 'react';
import { Edit3, X } from 'react-feather';
import { BorrLoanRowData } from '@/utils/DataTypes';
import LoanDetails from './TabForm/LoanDetails';
import SetEffectivityMaturity from './Tabs/SetEffectivityMaturity';
import useLoans from '@/hooks/useLoans';
interface BorrInfoProps {
  singleData: BorrLoanRowData | undefined;
  handleShowForm: (v: boolean) => void;
}

const LoanPnSigningForm: React.FC<BorrInfoProps> = ({ singleData, handleShowForm }) => {
  const [activeTab, setActiveTab] = useState<number>();

  const { loanSingleData, fetchSingLoans } = useLoans();

  const handleTabClick = (tabIndex: number) => {
    setActiveTab(tabIndex);
  };

  const handleRefetchData = () => {
    fetchSingLoans(Number(singleData?.id));
  };

  useEffect(() => {
    fetchSingLoans(Number(singleData?.id));
  }, []);

  return (
    <div className="w-full">
      <div className="border-b flex justify-between items-center border-stroke px-7 py-4 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">
          {loanSingleData?.loan_product?.description} 
        </h3>
        <span className="text-right cursor-pointer text-boxdark-2" onClick={() => { return handleShowForm(false); }}><X size={17}/></span>
      </div>
      {loanSingleData && (
        <>
          <LoanDetails loanSingleData={loanSingleData} />
          <div className="flex flex-col md:flex-row border-b mt-3">
            <button
              onClick={() => handleTabClick(1)}
              className={`p-4 text-sm font-medium flex items-center ${
                activeTab === 1
                  ? 'border-b-2 md:border-b-0 md:border-r-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              } focus:outline-none disabled:bg-slate-300 disabled:text-bodydark-300 disabled:cursor-not-allowed`}
              disabled={false}
            >
              <span className="mr-2"><Edit3 size={18} /></span> <span>Set Effectivity/Maturity</span>
            </button>
            <button
              onClick={() => handleTabClick(2)}
              className={`p-4 text-sm font-medium flex items-center ${
                activeTab === 2
                  ? 'border-b-2 md:border-b-0 md:border-r-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              } focus:outline-none disabled:bg-slate-300 disabled:text-bodydark-300 disabled:cursor-not-allowed`}
              disabled={loanSingleData?.status === 1 ? false : true}
            >
              <span className="mr-2"><Edit3 size={18} /></span> <span>PN Signing</span>
            </button>
            <button
              onClick={() => handleTabClick(3)}
              className={`p-4 text-sm font-medium flex items-center ${
                activeTab === 3
                  ? 'border-b-2 md:border-b-0 md:border-r-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              } focus:outline-none disabled:bg-slate-300 disabled:text-bodydark-300 disabled:cursor-not-allowed`}
              disabled={false}
            >
              <span className="mr-2"><Edit3 size={18} /></span> <span>Bank Details Entry</span>
            </button>
            <button
              onClick={() => handleTabClick(4)}
              className={`p-4 text-sm font-medium flex items-center ${
                activeTab === 4
                  ? 'border-b-2 md:border-b-0 md:border-r-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              } focus:outline-none disabled:bg-slate-300 disabled:text-bodydark-300 disabled:cursor-not-allowed`}
              disabled={loanSingleData?.status === 2 ? false : true}
            >
              <span className="mr-2"><Edit3 size={18} /></span> <span>Approve and Release</span>
            </button>
          </div>
        </>
      )}
      {/* Tab Content */}
      <div className="p-6 bg-white">
        {activeTab === 1 && (
          <div>
            {loanSingleData && (
              <SetEffectivityMaturity loanSingleData={loanSingleData} handleRefetchData={handleRefetchData}/>
            )}
          </div>
        )}
        {activeTab === 2 && (
          <div>
            <h2 className="text-xl font-semibold">PN Signing</h2>
            <p>This is the content for PN Signing.</p>
          </div>
        )}
        {activeTab === 3 && (
          <div>
            <h2 className="text-xl font-semibold">Bank Details Entry</h2>
            <p>This is the content for Bank Details Entry.</p>
          </div>
        )}
        {activeTab === 4 && (
          <div>
            <h2 className="text-xl font-semibold">Approve and Release</h2>
            <p>This is the content for Approve and Release.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanPnSigningForm;