import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import SourceTracker from './components/SourceTracker';

export const metadata = {
  title: "Source tracker | Fuerte",
  description: "",
};

/*
 * `tracker` is a static segment, so it wins over a dynamic /applications/[id].
 * The trail starts at Applications, not Dashboard: Call Center (who works only under
 * /applications) would otherwise get a first link that bounces straight back.
 */
const SourceTrackerPage: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb
          pageName="Source tracker"
          items={[{ label: 'Applications', href: '/applications' }, { label: 'Source tracker' }]}
        />
      </div>
      <SourceTracker />
    </DefaultLayout>
  );
};

export default SourceTrackerPage;
