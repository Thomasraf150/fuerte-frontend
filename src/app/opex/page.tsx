import React, { Suspense } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import OpexHome from './components/OpexHome';
import { SkeletonBlock } from '@/components/LoadingStates';

export const metadata = {
  title: 'OPEX Fund',
  description: '',
};

const OpexPage: React.FC = () => (
  <DefaultLayout>
    <div className="mx-auto">
      <Breadcrumb pageName="OPEX Fund" />
    </div>
    <Suspense fallback={<SkeletonBlock rows={6} label="Loading…" />}>
      <OpexHome />
    </Suspense>
  </DefaultLayout>
);

export default OpexPage;
