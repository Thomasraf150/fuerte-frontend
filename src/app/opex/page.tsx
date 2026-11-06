import React, { Suspense } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import OpexHome from './components/OpexHome';

export const metadata = {
  title: 'OPEX Fund',
  description: '',
};

const OpexPage: React.FC = () => (
  <DefaultLayout>
    <div className="mx-auto">
      <Breadcrumb pageName="OPEX Fund" />
    </div>
    <Suspense fallback={<p className="text-body">Loading…</p>}>
      <OpexHome />
    </Suspense>
  </DefaultLayout>
);

export default OpexPage;
