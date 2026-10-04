import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import ApplicationPage from './components/ApplicationPage';

export const metadata = {
  title: "Application | Fuerte",
  description: "",
};

/*
 * One application: its header, actions and form. `tracker` is a static segment, so it wins
 * over this dynamic one. The trail starts at Applications, not Dashboard: Call Center (who works
 * only under /applications) would otherwise get a first link that bounces straight back.
 * withAuth comes with DefaultLayout, and already lets Call Center stay under /applications/*.
 */
const ApplicationRoute: React.FC<{ params: { id: string } }> = ({ params }) => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName="Application"
          items={[{ label: 'Applications', href: '/applications' }, { label: 'Application' }]}
        />
      </div>
      <ApplicationPage id={params.id} />
    </DefaultLayout>
  );
};

export default ApplicationRoute;
