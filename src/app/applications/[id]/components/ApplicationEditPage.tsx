"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { ArrowLeft } from 'react-feather';
import LoadError from '@/app/applications/components/LoadError';
import { useCanUpload } from '@/app/applications/components/useCanUpload';
import useLoanApplication from '@/hooks/useLoanApplication';
import { notConvertibleReason } from '@/utils/convertApplication';
import { ApplicationForm } from './ApplicationForm';
import { ApplicationHeader } from './ApplicationHeader';
import { ApplicationSkeleton, NotFoundCard } from './PageStates';

const noop = () => {};

/**
 * /applications/[id]/edit (2026-10-28): the application's form on a page of its own, so Edit changes
 * the address and Back returns to the application. It loads the application from the URL like the
 * application page does. One the user may not change now -- a borrower already, or Marketing's view of
 * another branch's -- is not offered for editing: the page goes back to the application, which says why.
 * Save keeps the page open (Call Center saves as it goes, over the phone); Back returns to the
 * application, where the status, Print and Create as borrower are.
 */
const ApplicationEditPage: React.FC<{ id: string }> = ({ id }) => {
  const app = useLoanApplication(id);
  const router = useRouter();
  const mayAssign = useCanUpload();
  const record = app.record;
  const view = `/applications/${id}`;
  const locked = record !== null && (notConvertibleReason(record) === 'converted' || record.can_edit === false);

  useEffect(() => {
    if (locked) router.replace(view);
  }, [locked, router, view]);

  if (app.notFound) return <NotFoundCard />;
  if (app.error) return <LoadError message={app.error} onRetry={app.reload} />;
  if (!record || locked || mayAssign === null) return <ApplicationSkeleton />;

  return (
    <div className="space-y-4">
      <ApplicationHeader record={record} />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stroke bg-white p-3 shadow-default dark:border-strokedark dark:bg-boxdark md:px-5">
        <Link
          href={view}
          prefetch={false}
          className="inline-flex min-h-12 items-center gap-1.5 rounded px-2 text-sm font-medium text-primary transition-colors hover:text-opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:text-bodydark dark:hover:text-white dark:focus-visible:ring-offset-boxdark md:min-h-10"
        >
          <ArrowLeft aria-hidden="true" size={16} className="shrink-0" />
          Back to the application
        </Link>
        <p className="text-sm text-body dark:text-bodydark">
          <span className="font-display text-base font-semibold text-black dark:text-white">Editing</span>
          <span className="mx-2" aria-hidden="true">·</span>
          Save as you go. Go back to the application when you are done.
        </p>
      </div>
      <ApplicationForm key={record.id} record={record} mayAssign={mayAssign} saving={app.saving} save={app.save} onDirtyChange={noop} returnTo={view} />
    </div>
  );
};

export default ApplicationEditPage;
