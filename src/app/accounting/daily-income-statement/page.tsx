import React, { Suspense } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import DailyIncomeHome from './components/DailyIncomeHome';
import { SkeletonBlock } from '@/components/LoadingStates';

export const metadata = {
  title: 'Daily Income Statement',
  description: '',
};

const DailyIncomeStatementPage: React.FC = () => (
  <DefaultLayout>
    <div className="mx-auto">
      <Breadcrumb pageName="Daily Income Statement" />
    </div>
    <Suspense fallback={<SkeletonBlock rows={6} label="Loading…" />}>
      <DailyIncomeHome />
    </Suspense>
  </DefaultLayout>
);

export default DailyIncomeStatementPage;
