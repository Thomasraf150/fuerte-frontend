"use client";

import React, { useState } from 'react';
import { Lock } from 'react-feather';
import BorrowerDetails from './TabForm/BorrowerDetails'
import BorrowerAttachments from './TabForm/BorrowerAttachments'
import BorrowerCoMaker from './TabForm/BorrowerCoMaker'
import BorrowerLoans from './TabForm/BorrowerLoans'
import { BorrowerDecision, BorrowerRowInfo, DataChief, DataArea, DataSubArea, DataBorrCompanies, DataSubBranches } from '@/utils/DataTypes'
import type { BorrowerInfo as BorrowerFormValues, SelectOption } from '@/utils/DataTypes'
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
  /** The borrower's latest decision as the page holds it (the header updates it): the Loans tab reads it. */
  decision?: BorrowerDecision | null;
  setSingleData: (d: BorrowerRowInfo | undefined) => void;
  fetchDataBorrower: (v1: number, v2: number) => void;
  fetchDataChief: (v1: number, v2: number) => void;
  fetchDataArea: (v1: number, v2: number) => void;
  fetchDataSubArea: (v1: number) => void;
  fetchDataBorrCompany: (v1: number, v2: number) => void;
  /** Values the Details form starts from (an application's, on Create as borrower). Passed to BorrowerDetails, which reads them once, at mount. */
  initialValues?: Partial<BorrowerFormValues>;
  /** Branch choices that replace the assigned-branch picker (the application's one branch, on Create as borrower). Passed to BorrowerDetails, which then always shows the picker: creating only, never with singleData. */
  branchChoices?: SelectOption[];
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
  if (isActive) return 'border-primary text-primary';
  return 'border-transparent text-body dark:text-bodydark hover:border-primary hover:text-primary';
};

// One row at 360px: below `sm` the four labels drop to text-sm with tight padding and never
// wrap ("Co-Maker" used to break in two and "Attachments" was cut off), and a locked tab drops
// its lock icon (it stays disabled and greyed, and the draft note under the bar describes it),
// so New Borrower's row fits as well as a saved borrower's. From `sm` up they are as they were.
// Should the row still outgrow its card (a larger font), it scrolls inside its own row, never
// the page: justify-between below `sm`, because an overflowing justify-around row cuts off its
// left end.
const TAB_BAR = 'flex justify-between overflow-x-auto border-b dark:border-strokedark sm:justify-around';
/** The draft note under the tab bar, which also describes the locked tabs to a screen reader. */
const DRAFT_NOTE_ID = 'borrower-draft-note';
const TAB = 'flex min-h-[48px] shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-1.5 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:gap-1.5 sm:p-4 sm:text-base';

const BorrowerInfo: React.FC<BorrInfoProps> = ({ dataChief, dataArea, dataSubArea, dataBorrCompany, myAccessibleBranchSubs, loadingMyAccessibleBranches, setShowForm, singleData, decision, setSingleData, onSubmitBorrower, fetchDataSubArea, fetchDataBorrower, fetchDataChief, fetchDataArea, fetchDataBorrCompany, borrowerLoading, initialValues, branchChoices }) => {
  const [activeTab, setActiveTab] = useState<string>('tab1');
  const [showBorrAttForm, setShowBorrAttForm] = useState<boolean>(false);

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  return (
    <div>
      <div className="max-w-full lg:max-w-7xl mx-auto px-2 sm:px-4 lg:px-0">
        {/* The way back is the page header's labelled back link (BorrowerHeader), New Borrower's too. */}
        <div className="max-w-12xl mx-auto bg-white dark:bg-boxdark rounded-xl shadow-md overflow-hidden">
          {/* <div className="p-4">
            <h5 className="text-lg font-medium text-black dark:text-white">
              Task title
            </h5>
          </div> */}
          <div className={TAB_BAR}>
            {BORROWER_TABS.map(({ key, label, requiresSavedBorrower }) => {
              const locked = requiresSavedBorrower && !singleData?.id;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={locked}
                  aria-disabled={locked}
                  title={locked ? 'Save the borrower first to unlock this tab' : undefined}
                  aria-describedby={locked ? DRAFT_NOTE_ID : undefined}
                  className={`${TAB} ${tabClasses(locked, activeTab === key)}`}
                  onClick={() => handleTabClick(key)}
                >
                  {locked && <Lock aria-hidden="true" size={13} className="hidden shrink-0 sm:block" />}
                  {label}
                </button>
              );
            })}
          </div>
          {!singleData?.id && (
            <div id={DRAFT_NOTE_ID} className="border-b border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-black dark:text-white">
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
                  initialValues={initialValues}
                  branchChoices={branchChoices}
                />
              </div>
            )}
            {activeTab === 'tab2' && (
              <div id="content2">
                <BorrowerLoans singleData={singleData} decision={decision} />
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
