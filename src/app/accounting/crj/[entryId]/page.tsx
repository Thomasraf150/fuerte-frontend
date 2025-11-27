'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';
import useGeneralJournal from '@/hooks/useGeneralJournal';
import useCoa from '@/hooks/useCoa';
import CrjForm from '../components/CrjForm';
import { RowAcctgEntry } from '@/utils/DataTypes';
const CrjDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const entryId = params.entryId as string;
  const journalDate = searchParams.get('date') || '';

  const { fetchGJ, dataGj, loading: gjLoading } = useGeneralJournal();
  const { coaDataAccount, fetchCoaDataTable } = useCoa();

  // Get user data from localStorage (includes branch_sub_id)
  const storedAuthStore = typeof window !== 'undefined' ? localStorage.getItem('authStore') ?? '{}' : '{}';
  const userData = JSON.parse(storedAuthStore)['state'];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [singleData, setSingleData] = useState<RowAcctgEntry | undefined>(undefined);

  // Fetch journal entry data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!entryId || entryId === 'undefined') {
        setError('Invalid journal entry ID');
        setLoading(false);
        return;
      }

      if (!journalDate) {
        setError('Journal date is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const branchSubId = String(userData?.user?.branch_sub_id || '');

        // Fetch journal entries for the date range and COA data
        await Promise.all([
          fetchGJ(branchSubId, journalDate, journalDate, 'CRJ'),
          fetchCoaDataTable()
        ]);
      } catch (err: any) {
        console.error('Error fetching CRJ entry:', err);
        setError(err.message || 'Failed to load CRJ entry');
        setLoading(false);
      }
    };

    fetchData();
  }, [entryId, journalDate]);

  // Find the specific entry when data is loaded
  useEffect(() => {
    if (!gjLoading && dataGj) {
      const entry = dataGj.find(item => String(item.id) === entryId);
      if (entry) {
        setSingleData(entry);
        setError(null);
      } else {
        setError('CRJ entry not found');
      }
      setLoading(false);
    }
  }, [dataGj, gjLoading, entryId]);

  // Back button handler
  const handleBack = () => {
    router.push('/accounting/crj');
  };

  const handleShowForm = (show: boolean) => {
    if (!show) {
      handleBack();
    }
  };

  // Loading state
  if (loading || gjLoading) {
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
              {error || 'CRJ entry not found'}
            </h3>
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
            >
              Back to Cash Receipts Journal
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  const pageTitle = singleData.journal_ref
    ? `Reference #: ${singleData.journal_ref}`
    : 'CRJ Entry';

  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName={pageTitle}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Cash Receipts Journal', href: '/accounting/crj' },
            { label: pageTitle }
          ]}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="p-4 lg:p-7">
            <CrjForm
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

export default CrjDetailPage;
