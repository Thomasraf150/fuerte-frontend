import React, { Suspense } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import EfficiencyHome from './components/EfficiencyHome';
import { SkeletonBlock } from '@/components/LoadingStates';

export const metadata = {
  title: 'Collection Efficiency',
  description: '',
};

const CollectionEfficiencyPage: React.FC = () => (
  <DefaultLayout>
    <div className="mx-auto">
      <Breadcrumb pageName="Collection Efficiency" />
    </div>
    <Suspense fallback={<SkeletonBlock rows={6} label="Loading…" />}>
      <EfficiencyHome />
    </Suspense>
  </DefaultLayout>
);

export default CollectionEfficiencyPage;
