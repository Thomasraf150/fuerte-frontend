'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';
import useCollectionList from '@/hooks/useCollectionList';
import { Info, AlertTriangle } from 'react-feather';

const CollectionDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const scheduleId = params.scheduleId as string;
  const transDate = searchParams.get('date') || '';
  const loanRef = searchParams.get('ref') || '';

  const {
    fetchCollectionEntry,
    dataColEntry,
  } = useCollectionList();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        await fetchCollectionEntry(scheduleId, transDate);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching collection entry:', err);
        setError(err.message || 'Failed to load collection entry');
        setLoading(false);
      }
    };

    fetchData();
  }, [scheduleId, transDate]);

  const handleBack = () => {
    router.push('/collection-list');
  };

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

  if (error) {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Error" />
        </div>
        <div className="rounded-sm border border-stroke bg-white p-10 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-500 mb-4">{error}</h3>
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
          <div className="border-b border-stroke px-4 lg:px-7 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white mb-1">
              Collection Entry (Read-only)
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="font-semibold text-primary">{loanRef}</div>
              {transDate && (
                <div className="mt-1 text-xs">Transaction Date: {transDate}</div>
              )}
            </div>
            {isPosted ? (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <Info size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Posted to GL.
                  {dataColEntry[0]?.journal_ref && (
                    <span className="ml-2 font-semibold">Journal Ref: {dataColEntry[0].journal_ref}</span>
                  )}
                </span>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  Pending — awaiting backfill into the GL.
                </span>
              </div>
            )}
          </div>

          <div className="p-4 lg:p-7">
            <h4 className="text-md font-semibold mb-3 text-black dark:text-white">
              Payment Line Items
            </h4>
            {dataColEntry && dataColEntry.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium">Journal Ref</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataColEntry.map((entry, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">{entry.description}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {Number(entry.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3">
                          {entry.journal_ref ? (
                            <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-semibold">
                              {entry.journal_ref}
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {entry.journal_ref ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">Posted</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-yellow-800 dark:text-yellow-300">
                No payment entries found for this schedule and date.
              </div>
            )}

            <div className="mt-6 flex justify-start">
              <button
                onClick={handleBack}
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
              >
                Back to Collection List
              </button>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default CollectionDetailPage;
