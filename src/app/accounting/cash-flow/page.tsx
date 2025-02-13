import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import CashFlowList from './components/CashFlowList';

export const metadata = {
  title: "Cash Flow",
  description: "",
};

const CashFlow: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Cash Flow" />
      </div>
      <CashFlowList />
    </DefaultLayout>
  );
};

export default CashFlow;