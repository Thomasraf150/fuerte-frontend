import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import BalanceSheetList from './components/BalanceSheetList';

export const metadata = {
  title: "Balance Sheet",
  description: "",
};

const GeneralLedger: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Balance Sheet" />
      </div>
      <BalanceSheetList />
    </DefaultLayout>
  );
};

export default GeneralLedger;