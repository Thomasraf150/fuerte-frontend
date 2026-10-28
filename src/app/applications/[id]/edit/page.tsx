import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import ApplicationEditPage from '../components/ApplicationEditPage';

export const metadata = {
  title: "Edit application",
  description: "",
};

/*
 * Editing one application (2026-10-28): its own address, so Back works and the page can be bookmarked.
 * withAuth comes with DefaultLayout and already lets Call Center stay under /applications/*.
 */
const ApplicationEditRoute: React.FC<{ params: { id: string } }> = ({ params }) => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName="Edit application"
          items={[
            { label: 'Applications', href: '/applications' },
            { label: 'Application', href: `/applications/${encodeURIComponent(params.id)}` },
            { label: 'Edit' },
          ]}
        />
      </div>
      <ApplicationEditPage id={params.id} />
    </DefaultLayout>
  );
};

export default ApplicationEditRoute;
