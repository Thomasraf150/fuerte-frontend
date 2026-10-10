"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Check, X, Clock, Lock } from 'react-feather';
import { BorrLoanRowData } from '@/utils/DataTypes';
import LoanDetails from './TabForm/LoanDetails';
import SetEffectivityMaturity from './Tabs/SetEffectivityMaturity';
import useLoans from '@/hooks/useLoans';
import PNSigning from './Tabs/PNSigning';
import BankDetailsEntry from './Tabs/BankDetailsEntry';
import ReleaseLoans from './Tabs/ReleaseLoans';
import LoanHistory from './Tabs/LoanHistory';
import useCoa from '@/hooks/useCoa';
import { LoadingSpinner, SkeletonBlock } from '@/components/LoadingStates';
import { isLoanDeletable } from '@/hooks/loanDelete';
import LoanMoreMenu from './LoanMoreMenu';

interface BorrInfoProps {
  singleData: BorrLoanRowData | undefined;
  handleShowForm: (v: boolean) => void;
}

/**
 * Numbered step marker for the workflow tabs. Olive when current, a check when done, muted when
 * still ahead. Presentation only: the tab text and click handlers are unchanged.
 */
const StepMarker: React.FC<{ n: number; active: boolean; done: boolean; locked?: boolean }> = ({ n, active, done, locked = false }) => (
  <span
    aria-hidden="true"
    className={`mr-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold tabular-nums ${
      active
        ? 'border-primary bg-primary text-white'
        : done
        ? 'border-primary text-primary dark:border-olive-300 dark:text-olive-300'
        : 'border-stroke text-bodydark dark:border-strokedark'
    }`}
  >
    {done && !active ? <Check size={13} strokeWidth={3} /> : locked ? <Lock size={12} strokeWidth={2.5} /> : n}
  </span>
);

const LoanPnSigningForm: React.FC<BorrInfoProps> = ({ singleData, handleShowForm }) => {
  const [activeTab, setActiveTab] = useState<number>();
  const { coaDataAccount, branchSubData, fetchCoaDataTable } = useCoa();
  const { loanSingleData, fetchSingLoans, onSubmitLoanRelease, printLoanDetails, handleChangeReleasedDate, handleUpdateReleasedLoanInfo, retryAutoPostAccounting, cancelAndRepostAccounting } = useLoans();

  const handleTabClick = (tabIndex: number) => {
    setActiveTab(tabIndex);
  };

  // Tracks the post-mutation refetch that follows a release / approve /
  // bank-details save. The page-level overlay below stays up until the
  // new loanSingleData lands — covers the gap where the success toast
  // had already fired but the header (Status, Loan Ref) hadn't updated yet.
  const [refetching, setRefetching] = useState<boolean>(false);

  const handleRefetchData = async () => {
    setRefetching(true);
    try {
      await fetchSingLoans(Number(singleData?.id));
    } finally {
      setRefetching(false);
    }
  };

  useEffect(() => {
    fetchSingLoans(Number(singleData?.id));
  }, []);

  // Step states come only from loan fields the old tabs already used to enable themselves:
  // loan_schedules (step 2 gate), is_pn_signed + status (step 3 gate), status > 1 (step 4 gate), status 3 (released).
  const status = Number(loanSingleData?.status ?? 0);
  const hasSchedule = (loanSingleData?.loan_schedules?.length ?? 0) > 0;
  const steps = [
    { n: 1, label: 'Set Effectivity/Maturity', disabled: false, done: hasSchedule },
    { n: 2, label: 'PN Signing', disabled: !hasSchedule, done: loanSingleData?.is_pn_signed === 1 },
    { n: 3, label: 'Bank Details Entry', disabled: !(status > 0 && loanSingleData?.is_pn_signed === 1), done: status > 1 },
    { n: 4, label: 'Approve and Release', disabled: !(status > 1), done: status === 3 },
  ];

  // The step to do next is always open: on load, and again whenever finishing a step moves it on.
  // Keyed on the step number, so a tab the user clicks stays put until the loan actually progresses.
  // A released loan has no next step and opens on nothing, as before; checked on status, not the
  // steps, because 56 released loans still carry is_pn_signed = 0 and would open on PN Signing.
  const nextStep = status === 3 ? undefined : steps.find((s) => !s.done && !s.disabled)?.n;
  const openedFor = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!loanSingleData || nextStep === undefined || openedFor.current === nextStep) return;
    openedFor.current = nextStep;
    setActiveTab(nextStep);
  }, [loanSingleData, nextStep]);

  return (
    <div className="w-full relative">
      {refetching && (
        <div className="absolute inset-0 bg-white/80 dark:bg-boxdark/80 z-50 flex items-start justify-center pt-20 rounded-lg">
          <LoadingSpinner size="lg" message="Updating loan details..." />
        </div>
      )}
      <div className="border-b flex justify-between items-center gap-3 border-stroke px-7 py-4 dark:border-strokedark">
        <h3 className="min-w-0 font-medium text-black dark:text-white">
          {loanSingleData?.loan_product?.description}
        </h3>
        {/* `relative`: the More menu opens against this row, so it never leaves the screen. */}
        <div className="relative flex shrink-0 items-center gap-2">
          {/* Delete, as the Loans list offers it, and only when the list would (isLoanDeletable). */}
          {loanSingleData && isLoanDeletable(loanSingleData) && (
            <LoanMoreMenu loan={loanSingleData} onDeleted={() => handleShowForm(false)} />
          )}
          <button
            type="button"
            aria-label="Close"
            onClick={() => { return handleShowForm(false); }}
            className="-mr-3 flex h-12 w-12 items-center justify-center rounded-full text-boxdark-2 hover:bg-whiten focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:-mr-2 md:h-10 md:w-10 dark:text-bodydark dark:hover:bg-meta-4"
          >
            <X size={17} />
          </button>
        </div>
      </div>
      {!loanSingleData ? (
        <div className="px-7 py-6">
          <SkeletonBlock rows={5} label="Loading the loan…" />
        </div>
      ) : (
        <>
          <LoanDetails loanSingleData={loanSingleData} printLoanDetails={printLoanDetails} />
          {/* Phones: say where you are, since the list below is long. */}
          {activeTab !== undefined && activeTab >= 1 && activeTab <= 4 && (
            <p className="mt-3 px-4 text-sm font-semibold text-black md:hidden dark:text-white">
              Step {activeTab} of 4: {steps[activeTab - 1].label}
            </p>
          )}
          {/* Phones stack the steps, marked by a left bar; wider screens put them in a row, marked by an underline. */}
          <div className="flex flex-col md:flex-row md:flex-wrap border-b border-stroke dark:border-strokedark mt-3">
            {steps.map((step) => {
              const isActive = activeTab === step.n;
              return (
                <button
                  key={step.n}
                  onClick={() => handleTabClick(step.n)}
                  aria-current={isActive ? 'step' : undefined}
                  aria-disabled={step.disabled || undefined}
                  title={step.done ? 'Done' : undefined}
                  className={`min-h-12 p-4 text-sm font-medium flex items-center border-l-4 md:border-l-0 md:border-b-2 transition-all duration-200 ease-in-out ${
                    isActive
                      ? 'border-primary text-primary font-bold dark:text-olive-300 dark:border-olive-300'
                      : 'border-transparent text-body dark:text-bodydark hover:text-primary'
                  } focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:bg-whiten disabled:text-bodydark disabled:cursor-not-allowed dark:disabled:bg-meta-4`}
                  disabled={step.disabled}
                >
                  <StepMarker n={step.n} active={isActive} done={step.done} locked={step.disabled} />
                  <span>{step.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => handleTabClick(5)}
              aria-current={activeTab === 5 ? 'step' : undefined}
              className={`min-h-12 p-4 text-sm font-medium flex items-center border-l-4 md:border-l-0 md:border-b-2 transition-all duration-200 ease-in-out ${
                    activeTab === 5
                      ? 'border-primary text-primary font-bold dark:text-olive-300 dark:border-olive-300'
                      : 'border-transparent text-body dark:text-bodydark hover:text-primary'
                  } focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
            >
              <span className="mr-2"><Clock size={18} /></span> <span>History</span>
            </button>
          </div>
        </>
      )}
      {/* Tab Content */}
      <div className="p-6 bg-white dark:bg-boxdark">
        {activeTab === 1 && (
          <div>
            {loanSingleData && (
              <SetEffectivityMaturity loanSingleData={loanSingleData} handleRefetchData={handleRefetchData}/>
            )}
          </div>
        )}
        {activeTab === 2 && (
          <div>
            {loanSingleData && (
              <PNSigning loanSingleData={loanSingleData} handleRefetchData={handleRefetchData} />
            )}
          </div>
        )}
        {activeTab === 3 && (
          <div>
            {loanSingleData && (
              <BankDetailsEntry loanSingleData={loanSingleData} handleRefetchData={handleRefetchData} />
            )}
          </div>
        )}
        {activeTab === 4 && (
          <div>
            {loanSingleData && (
              <ReleaseLoans
                coaDataAccount={coaDataAccount || []}
                branchSubData={branchSubData}
                fetchCoaDataTable={fetchCoaDataTable}
                loanSingleData={loanSingleData}
                handleRefetchData={handleRefetchData}
                onSubmitLoanRelease={onSubmitLoanRelease}
                handleChangeReleasedDate={handleChangeReleasedDate}
                handleUpdateReleasedLoanInfo={handleUpdateReleasedLoanInfo}
                retryAutoPostAccounting={retryAutoPostAccounting}
                cancelAndRepostAccounting={cancelAndRepostAccounting}
              />
            )}
          </div>
        )}
        {activeTab === 5 && (
          <div>
            {loanSingleData && (
              <LoanHistory loanId={Number(loanSingleData.id)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanPnSigningForm;