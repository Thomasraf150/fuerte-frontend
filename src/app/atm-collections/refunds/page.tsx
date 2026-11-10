import React, { Suspense } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import RefundsHome from '../components/RefundsHome';
import { SkeletonBlock } from '@/components/LoadingStates';

export const metadata = {
  title: 'Refunds & Funds',
  description: '',
};

const RefundsPage: React.FC = () => (
  <DefaultLayout>
    <div className="mx-auto">
      <Breadcrumb pageName="Refunds & Funds" />
    </div>
    <Suspense fallback={<SkeletonBlock rows={6} label="Loading…" />}>
      <RefundsHome />
    </Suspense>
  </DefaultLayout>
);

export default RefundsPage;
