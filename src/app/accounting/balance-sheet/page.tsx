import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import ReportGuard from '@/components/Guards/ReportGuard';
import './styles.css';
import BalanceSheetList from './components/BalanceSheetList';

export const metadata = {
  title: "Balance Sheet",
  description: "",
};

const GeneralLedger: React.FC = () => {
  return (
    <DefaultLayout>
      <ReportGuard>
        <div className="mx-auto">
          <Breadcrumb pageName="Balance Sheet" />
        </div>
        <BalanceSheetList />
      </ReportGuard>
    </DefaultLayout>
  );
};

export default GeneralLedger;