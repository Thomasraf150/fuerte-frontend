'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';
import GeneralJournalQueryMutations from '@/graphql/GeneralJournalQueryMutations';
import useCoa from '@/hooks/useCoa';
import CdjForm from '../components/CdjForm';
import { RowAcctgEntry } from '@/utils/DataTypes';

const CdjDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const entryId = params.entryId as string;
  const journalDate = searchParams.get('date') || '';

  const { coaDataAccount, fetchCoaDataTable } = useCoa();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [singleData, setSingleData] = useState<RowAcctgEntry | undefined>(undefined);

  // Fetch CDJ entry directly by ID (fixes pagination bug)
  useEffect(() => {
    const fetchCdjEntry = async () => {
      if (!entryId || entryId === 'undefined') {
        setError('Invalid CDJ entry ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch CDJ entry by ID and COA data in parallel
        const [journalResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: GeneralJournalQueryMutations.GET_JOURNAL_ENTRY_BY_ID,
              variables: { id: entryId },
            }),
          }),
          fetchCoaDataTable()
        ]);

        const result = await journalResponse.json();

        if (result.errors) {
          setError(result.errors[0]?.message || 'Failed to load CDJ entry');
          return;
        }

        if (result.data?.getJournalEntryById) {
          setSingleData(result.data.getJournalEntryById);
          setError(null);
        } else {
          setError('CDJ entry not found');
        }
      } catch (err: any) {
        console.error('Error fetching CDJ entry:', err);
        setError(err.message || 'Failed to load CDJ entry');
      } finally {
        setLoading(false);
      }
    };

    fetchCdjEntry();
  }, [entryId]);

  // Back button handler
  const handleBack = () => {
    router.push('/accounting/cdj');
  };

  const handleShowForm = (show: boolean) => {
    if (!show) {
      handleBack();
    }
  };

  // Loading state
  if (loading) {
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
  if (error || !singleData) {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Error" />
        </div>
        <div className="rounded-sm border border-stroke bg-white p-10 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-500 mb-4">
              {error || 'CDJ entry not found'}
            </h3>
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
            >
              Back to Cash Disbursements Journal
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  const pageTitle = singleData.journal_ref
    ? `Reference #: ${singleData.journal_ref}`
    : 'CDJ Entry';

  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName={pageTitle}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Cash Disbursements Journal', href: '/accounting/cdj' },
            { label: pageTitle }
          ]}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="p-4 lg:p-7">
            <CdjForm
              setShowForm={handleShowForm}
              actionLbl="Reference #:"
              singleData={singleData}
              loading={false}
              coaDataAccount={coaDataAccount || []}
              fetchCoaDataTable={fetchCoaDataTable}
            />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default CdjDetailPage;
