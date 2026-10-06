import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { readListParams } from '@/utils/applicationOutcome';
import ApplicationList from './components/ApplicationList';

export const metadata = {
  title: "Applications",
  description: "",
};

/*
 * `?outcome=&status=&from=&to=` (the Source tracker's funnel links here) are read on the server
 * and handed to the list, so its first fetch already carries them: no unfiltered flash, and no
 * useSearchParams, which on Next 14.2.3 fails `next build` without a <Suspense> boundary.
 */
const Applications: React.FC<{ searchParams?: Record<string, string | string[] | undefined> }> = ({ searchParams }) => {
  const initial = readListParams(searchParams ?? {});
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Applications" />
      </div>
      {/* Keyed by the filters, so a link to other filters (from a page already on the list) starts afresh. */}
      <ApplicationList key={JSON.stringify(initial)} initial={initial} />
    </DefaultLayout>
  );
};

export default Applications;
