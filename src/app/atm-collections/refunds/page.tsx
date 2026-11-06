import React, { Suspense } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import RefundsHome from '../components/RefundsHome';

export const metadata = {
  title: 'Refunds & Funds',
  description: '',
};

const RefundsPage: React.FC = () => (
  <DefaultLayout>
    <div className="mx-auto">
      <Breadcrumb pageName="Refunds & Funds" />
    </div>
    <Suspense fallback={<p className="text-body">Loading…</p>}>
      <RefundsHome />
    </Suspense>
  </DefaultLayout>
);

export default RefundsPage;
