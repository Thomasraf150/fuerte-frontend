import React, { Suspense } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import ReportGuard from '@/components/Guards/ReportGuard';
import { SkeletonBlock } from '@/components/LoadingStates';
import TreasuryCashHome from './components/TreasuryCashHome';

export const metadata = {
  title: 'Treasury Cash Report',
  description: 'Cash on hand and in banks: beginning, deposits, disbursements and ending balance for a month or cut-off.',
};

// useSearchParams (period and branch live in the URL) needs a Suspense boundary for `next build`.
const TreasuryCashPage: React.FC = () => (
  <DefaultLayout>
    <ReportGuard>
      <div className="mx-auto">
        <Breadcrumb pageName="Treasury Cash Report" />
      </div>
      <Suspense fallback={<SkeletonBlock rows={6} label="Loading the cash report…" />}>
        <TreasuryCashHome />
      </Suspense>
    </ReportGuard>
  </DefaultLayout>
);

export default TreasuryCashPage;
