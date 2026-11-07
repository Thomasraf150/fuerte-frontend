import React, { Suspense } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import DailyIncomeHome from './components/DailyIncomeHome';

export const metadata = {
  title: 'Daily Income Statement',
  description: '',
};

const DailyIncomeStatementPage: React.FC = () => (
  <DefaultLayout>
    <div className="mx-auto">
      <Breadcrumb pageName="Daily Income Statement" />
    </div>
    <Suspense fallback={<p className="text-body">Loading…</p>}>
      <DailyIncomeHome />
    </Suspense>
  </DefaultLayout>
);

export default DailyIncomeStatementPage;
