'use client';

import { MAX_COMPANY_DROPDOWN_SIZE, MAX_DROPDOWN_SIZE } from '@/constants/pagination';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';
import useBorrowerDetail from '@/hooks/useBorrowerDetail';
import useBranches from '@/hooks/useBranches';
import useConvertApplication, { isStop } from '@/hooks/useConvertApplication';
import BorrowerHeader from '../components/BorrowerHeader';
import BorrowerInfo from '../components/BorrowerInfo';
import { ConvertBanner, ConvertStop } from '../components/ConvertFromApplication';
import { BorrowerDecision, BorrowerRowInfo } from '@/utils/DataTypes';
import { useAuthStore } from '@/store/authStore';
import { useDocumentTitle, borrowerTitle } from '@/hooks/useDocumentTitle';

const BorrowerDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const borrowerId = params.id as string;

  const {
    dataChief,
    dataArea,
    dataSubArea,
    dataBorrCompany,
    onSubmitBorrower,
    borrowerLoading,
    fetchDataChief,
    fetchDataArea,
    fetchDataSubArea,
    fetchDataBorrCompany,
    fetchSingleBorrower,
  } = useBorrowerDetail();

  // Branch picker data for multi-branch users. The form only renders the
  // dropdown when assignedBranchSubIds.length > 1, but fetching is cheap
  // and the resolver already gates by role.
  const {
    myAccessibleBranchSubs,
    fetchMyAccessibleBranchSubs,
    loadingMyAccessibleBranches,
  } = useBranches();

  const [singleData, setSingleData] = useState<BorrowerRowInfo | undefined>(undefined);
  // Tab: the borrower's name once loaded; "New borrower" on /borrowers/new.
  useDocumentTitle(borrowerId === 'new' ? 'New borrower' : borrowerTitle(singleData));
  // The latest Approved / Rejected, held apart from singleData: the header's decision updates it, and
  // a new singleData object would reload the Details form over unsaved edits. Re-read per borrower.
  const [decision, setDecision] = useState<BorrowerDecision | null>(null);
  useEffect(() => {
    setDecision(singleData?.decision ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleData?.id]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create as borrower: /borrowers/new?application=<id> opens the form on that application.
  // Without a usable ?application= (or on an existing borrower) this is all inert.
  const convert = useConvertApplication(borrowerId === 'new');
  // Read once from the persisted store (hydrated on the client), as CallCenterGuard does.
  const isCallCenter = useAuthStore.getState().user?.role?.code === 'CALLCTR';

  // Fetch reference data on mount
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          // Chiefs (9 live rows) and Areas (66) fit inside MAX_DROPDOWN_SIZE.
          // Companies do NOT — 891 live rows — and asking for 100 silently
          // showed 100 of 891 on a REQUIRED field, with no error anywhere.
          // That truncation is why getBorrCompanies carries a raised cap.
          fetchDataChief(MAX_DROPDOWN_SIZE, 1),
          fetchDataArea(MAX_DROPDOWN_SIZE, 1),
          fetchDataBorrCompany(MAX_COMPANY_DROPDOWN_SIZE, 1),
          // Call Center files a borrower under no branch of its own (the application's): no list to ask for.
          ...(isCallCenter ? [] : [fetchMyAccessibleBranchSubs()]),
        ]);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching reference data:', err);
        setError('Failed to load reference data');
        setLoading(false);
      }
    };

    fetchReferenceData();
  }, []);

  // Call Center is on New Borrower only to Create as borrower from an application (withAuth lets it
  // onto /borrowers/new for that): without a usable ?application= it goes back to the Applications.
  useEffect(() => {
    if (isCallCenter && convert.state.kind === 'off') router.replace('/applications');
  }, [isCallCenter, convert.state.kind, router]);

  // Back button handler
  const handleBack = () => {
    router.push('/borrowers');
  };

  // Where the page goes back to: the header's back link, the form's Back buttons, and a successful
  // save (BorrowerDetails calls setShowForm(false) after one, and the save's own callback runs
  // first, so all of them must agree). Opened from an application (New Borrower with a usable
  // ?application=), it goes back to that application in every state: ready, and the cards that say
  // why it cannot become a borrower yet. Never to the list.
  const applicationId = 'id' in convert.state ? convert.state.id : null;
  const back = applicationId !== null
    ? { href: `/applications/${applicationId}`, label: 'Application' }
    : { href: '/borrowers', label: 'Borrowers' };

  const closeForm = () => {
    router.push(back.href);
  };

  const handleShowForm = (show: boolean) => {
    if (!show) {
      closeForm();
    }
  };

  // Fetch borrower data when ID changes
  useEffect(() => {
    const fetchBorrowerData = async () => {
      if (borrowerId === 'new') {
        // Create mode - no singleData needed
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const borrower = await fetchSingleBorrower(Number(borrowerId));
        setSingleData(borrower);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching borrower:', err);
        setError(err.message || 'Failed to load borrower details');
        setLoading(false);
      }
    };

    fetchBorrowerData();
  }, [borrowerId]);

  // The header's title when there is no borrower: New Borrower ('Borrower' only if a saved
  // borrower ever rendered without its record). A saved borrower's header carries its name.
  const title = borrowerId === 'new' ? 'New Borrower' : 'Borrower';

  // Loading state (and, on Create as borrower, until the application is read and loaded:
  // the form takes its starting values once, so it must not open before them)
  if (loading || convert.pending) {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Loading..." />
        </div>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DefaultLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Error" />
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-10 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-danger mb-4">
              {error}
            </h3>
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
            >
              Back to Borrowers List
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  // Main content
  return (
    <DefaultLayout>
      <BorrowerHeader key={singleData?.id ?? 'new'} borrower={singleData} back={back} title={title} onDecided={setDecision} />

      <div className="flex flex-col gap-6">
        {convert.state.kind === 'ready' && <ConvertBanner applicationId={convert.state.id} focusOnMount={convert.retried} />}
        {isStop(convert.state) ? (
          // Create as borrower, but the application cannot become one (yet): the reason, not the form
          <ConvertStop state={convert.state} onRetry={convert.retry} focusOnMount={convert.retried} />
        ) : (
          <BorrowerInfo
            setShowForm={handleShowForm}
            singleData={singleData}
            decision={decision}
            setSingleData={setSingleData}
            dataChief={dataChief}
            dataArea={dataArea}
            dataSubArea={dataSubArea}
            dataBorrCompany={dataBorrCompany}
            myAccessibleBranchSubs={myAccessibleBranchSubs}
            // Converting: the picker offers the application's branch alone, which needs no fetch.
            loadingMyAccessibleBranches={loadingMyAccessibleBranches && !convert.branchChoices}
            initialValues={convert.initialValues}
            branchChoices={convert.branchChoices}
            onSubmitBorrower={async (data) => {
              // On success: navigate back to the list (or, converting an application, to it).
              const result = await onSubmitBorrower(data, closeForm, convert.conversion);
              return result;
            }}
            borrowerLoading={borrowerLoading}
            fetchDataBorrower={async () => {}} // Not needed on detail page
            fetchDataChief={fetchDataChief}
            fetchDataArea={fetchDataArea}
            fetchDataSubArea={fetchDataSubArea}
            fetchDataBorrCompany={fetchDataBorrCompany}
          />
        )}
      </div>
    </DefaultLayout>
  );
};

export default BorrowerDetailPage;
