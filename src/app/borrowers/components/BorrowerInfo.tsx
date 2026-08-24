"use client";

import React, { useState } from 'react';
import { CornerUpLeft, Lock } from 'react-feather';
import BorrowerDetails from './TabForm/BorrowerDetails'
import BorrowerAttachments from './TabForm/BorrowerAttachments'
import BorrowerCoMaker from './TabForm/BorrowerCoMaker'
import BorrowerLoans from './TabForm/BorrowerLoans'
import { BorrowerRowInfo, DataChief, DataArea, DataSubArea, DataBorrCompanies, DataSubBranches } from '@/utils/DataTypes'
interface BorrInfoProps {
  setShowForm: (v: boolean) => void;
  dataChief?: DataChief[] | undefined;
  dataArea?: DataArea[] | undefined;
  dataSubArea?: DataSubArea[] | undefined;
  dataBorrCompany?: DataBorrCompanies[] | undefined;
  myAccessibleBranchSubs?: DataSubBranches[] | undefined;
  loadingMyAccessibleBranches?: boolean;
  onSubmitBorrower: (d: any) => Promise<{ success: boolean }>;
  borrowerLoading: boolean;
  singleData?: BorrowerRowInfo | undefined;
  setSingleData: (d: BorrowerRowInfo | undefined) => void;
  fetchDataBorrower: (v1: number, v2: number) => void;
  fetchDataChief: (v1: number, v2: number) => void;
  fetchDataArea: (v1: number, v2: number) => void;
  fetchDataSubArea: (v1: number) => void;
  fetchDataBorrCompany: (v1: number, v2: number) => void;
}

// Loans, Co-Maker and Attachments all key off a borrower id. On an unsaved
// (draft) borrower there is none, so they stay locked — otherwise staff can
// fill in a whole loan and only find out at the final Save that the borrower
// was never persisted.
const BORROWER_TABS = [
  { key: 'tab1', label: 'Details', requiresSavedBorrower: false },
  { key: 'tab2', label: 'Loans', requiresSavedBorrower: true },
  { key: 'tab3', label: 'Co-Maker', requiresSavedBorrower: true },
  { key: 'tab4', label: 'Attachments', requiresSavedBorrower: true },
] as const;

const tabClasses = (locked: boolean, isActive: boolean): string => {
  if (locked) return 'border-transparent text-bodydark2 opacity-60 cursor-not-allowed';
  if (isActive) return 'border-blue-500 text-blue-500';
  return 'border-transparent text-body dark:text-bodydark hover:border-blue-500 hover:text-blue-500';
};

const BorrowerInfo: React.FC<BorrInfoProps> = ({ dataChief, dataArea, dataSubArea, dataBorrCompany, myAccessibleBranchSubs, loadingMyAccessibleBranches, setShowForm, singleData, setSingleData, onSubmitBorrower, fetchDataSubArea, fetchDataBorrower, fetchDataChief, fetchDataArea, fetchDataBorrCompany, borrowerLoading }) => {
  const [activeTab, setActiveTab] = useState<string>('tab1');
  const [showBorrAttForm, setShowBorrAttForm] = useState<boolean>(false);

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  return (
    <div>
      <div className="max-w-full lg:max-w-7xl mx-auto px-2 sm:px-4 lg:px-0">
        <button
          className="flex justify-center rounded border bg-white dark:bg-boxdark border-stroke px-6 py-4 mb-4 space-x-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          type="button"
          onClick={() => { setShowForm(false) }}
        >
         <CornerUpLeft size={15} />
        </button>
        <div className="max-w-12xl mx-auto bg-white dark:bg-boxdark rounded-xl shadow-md overflow-hidden">
          {/* <div className="p-4">
            <h5 className="text-lg font-medium text-black dark:text-white">
              Task title
            </h5>
          </div> */}
          <div className="flex justify-around border-b dark:border-strokedark">
            {BORROWER_TABS.map(({ key, label, requiresSavedBorrower }) => {
              const locked = requiresSavedBorrower && !singleData?.id;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={locked}
                  aria-disabled={locked}
                  title={locked ? 'Save the borrower first to unlock this tab' : undefined}
                  className={`flex items-center gap-1.5 p-4 focus:outline-none border-b-2 ${tabClasses(locked, activeTab === key)}`}
                  onClick={() => handleTabClick(key)}
                >
                  {locked && <Lock size={13} />}
                  {label}
                </button>
              );
            })}
          </div>
          {!singleData?.id && (
            <div className="border-b border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-black dark:text-white">
              <span className="font-medium">Draft borrower.</span>{' '}
              Save the details below to unlock Loans, Co-Maker and Attachments.
            </div>
          )}

          <div className="p-2 sm:p-4">
            {activeTab === 'tab1' && (
              <div id="content1">
                <BorrowerDetails
                  dataChief={dataChief}
                  dataArea={dataArea}
                  dataSubArea={dataSubArea}
                  dataBorrCompany={dataBorrCompany}
                  myAccessibleBranchSubs={myAccessibleBranchSubs}
                  loadingMyAccessibleBranches={loadingMyAccessibleBranches}
                  onSubmitBorrower={onSubmitBorrower}
                  borrowerLoading={borrowerLoading}
                  singleData={singleData}
                  setSingleData={setSingleData}
                  setShowForm={setShowForm}
                  fetchDataBorrower={fetchDataBorrower}
                  fetchDataChief={fetchDataChief}
                  fetchDataArea={fetchDataArea}
                  fetchDataSubArea={fetchDataSubArea}
                  fetchDataBorrCompany={fetchDataBorrCompany}
                />
              </div>
            )}
            {activeTab === 'tab2' && (
              <div id="content2">
                <BorrowerLoans singleData={singleData} />
              </div>
            )}
            {activeTab === 'tab3' && (
              <div id="content3">
                <BorrowerCoMaker singleData={singleData} />
              </div>
            )}
            {activeTab === 'tab4' && (
              <div id="content4">
                <BorrowerAttachments singleData={singleData} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrowerInfo;
