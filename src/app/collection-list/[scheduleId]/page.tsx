'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { SkeletonBlock } from '@/components/LoadingStates';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardBody } from '@/components/Card';
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
        <Card className="min-h-[400px]">
          <CardBody>
            <SkeletonBlock rows={5} label="Loading the collection entry…" />
          </CardBody>
        </Card>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <div className="mx-auto">
          <Breadcrumb pageName="Error" />
        </div>
        <Card>
          <CardBody className="text-center sm:p-10">
          <div>
            <h3 className="text-xl font-semibold text-danger mb-4">{error}</h3>
            <Button variant="primary" onClick={handleBack}>
              Back to Collection List
            </Button>
          </div>
          </CardBody>
        </Card>
      </DefaultLayout>
    );
  }

  const pageTitle = loanRef ? `Collection Entry: ${loanRef}` : 'Collection Entry';
  const isPosted = dataColEntry && dataColEntry.length > 0 && !!dataColEntry[0]?.journal_ref;
  // Every line carries the same borrower (the server stamps it per entry).
  const borrowerName = dataColEntry?.[0]?.borrower_name ?? null;

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
        <Card>
          <div className="border-b border-stroke px-4 py-4 sm:px-6 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white mb-1">
              Collection Entry (Read-only)
            </h3>
            {/* Whose collection this is leads the card (NN/g: a human-readable identifier,
                not just a ref code); ref and date sit beneath it as the receipt's reference line. */}
            {borrowerName && (
              <p className="font-display text-xl uppercase leading-snug text-black dark:text-white">
                <span className="sr-only">Borrower: </span>
                {borrowerName}
              </p>
            )}
            <div className="mt-0.5 text-sm text-body dark:text-bodydark">
              <span className="font-semibold tabular-nums text-primary dark:text-olive-300">{loanRef}</span>
              {transDate && (
                <>
                  <span aria-hidden="true"> &middot; </span>
                  <span className="sr-only">, </span>
                  Transaction Date: <span className="tabular-nums">{transDate}</span>
                </>
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

          <CardBody>
            <h4 className="text-md font-semibold text-black dark:text-white">
              Payment Line Items
            </h4>
            {dataColEntry && dataColEntry.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-whiten dark:bg-boxdark text-left">
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
                        className="border-b border-stroke dark:border-strokedark hover:bg-whiten dark:hover:bg-boxdark/50"
                      >
                        <td className="px-4 py-3">{entry.description}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {Number(entry.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3">
                          {entry.journal_ref ? (
                            <StatusBadge tone="neutral" icon={false}>
                              {entry.journal_ref}
                            </StatusBadge>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {entry.journal_ref ? (
                            <StatusBadge tone="posted">Posted</StatusBadge>
                          ) : (
                            <StatusBadge tone="pending">Pending</StatusBadge>
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

            <div className="flex justify-start">
              <Button variant="primary" onClick={handleBack}>
                Back to Collection List
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
};

export default CollectionDetailPage;
