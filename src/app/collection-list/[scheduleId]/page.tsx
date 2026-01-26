'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';
import useCollectionList from '@/hooks/useCollectionList';
import useCoa from '@/hooks/useCoa';
import ColAcctgEntryForm from '../components/Forms/ColAcctgEntryForm';
import { Loader, Info } from 'react-feather';

const CollectionDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const scheduleId = params.scheduleId as string;
  const transDate = searchParams.get('date') || '';
  const loanRef = searchParams.get('ref') || '';

  const {
    fetchCollectionEntry,
    fetchCollectionList,
    dataColEntry,
  } = useCollectionList();

  const { coaDataAccount, fetchCoaDataTable } = useCoa();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!scheduleId || scheduleId === 'undefined' || !transDate) {
        setError('Invalid schedule ID or transaction date');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        await Promise.all([
          fetchCollectionEntry(scheduleId, transDate),
          fetchCoaDataTable()
        ]);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching collection entry:', err);
        setError(err.message || 'Failed to load collection entry');
        setLoading(false);
      }
    };

    fetchData();
  }, [scheduleId, transDate]);

  // Back button handler
  const handleBack = () => {
    router.push('/collection-list');
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
  if (error) {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Error" />
        </div>
        <div className="rounded-sm border border-stroke bg-white p-10 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-500 mb-4">
              {error}
            </h3>
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
            >
              Back to Collection List
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  const pageTitle = loanRef ? `Collection Entry: ${loanRef}` : 'Collection Entry';

  // Determine if entry is already posted (read-only mode)
  const isPosted = dataColEntry && dataColEntry.length > 0 && !!dataColEntry[0]?.journal_ref;

  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName={pageTitle}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Collection List', href: '/collection-list' },
            { label: pageTitle }
          ]}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          {/* Header with loan info */}
          <div className="border-b border-stroke px-4 lg:px-7 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white mb-1">
              Subsidiary Entry
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="font-semibold text-primary">
                {loanRef}
              </div>
              {transDate && (
                <div className="mt-1 text-xs">
                  Transaction Date: {transDate}
                </div>
              )}
            </div>
            {isPosted && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <Info size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  This entry has been posted and is in read-only mode.
                  {dataColEntry[0]?.journal_ref && (
                    <span className="ml-2 font-semibold">Journal Ref: {dataColEntry[0].journal_ref}</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Form section */}
          <div className="p-4 lg:p-7">
            <ColAcctgEntryForm
              dataColEntry={dataColEntry || []}
              coaDataAccount={coaDataAccount || []}
              fetchCollectionList={fetchCollectionList}
              setShowForm={handleShowForm}
              isLoading={false}
              isPosted={isPosted}
            />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default CollectionDetailPage;
