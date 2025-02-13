import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import AdjustedTrialBalanceList from './components/AdjustedTrialBalanceList';

export const metadata = {
  title: "Adjusted Trial Balance",
  description: "",
};

const UnadjustedTrialBalance: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Adjusted Trial Balance" />
      </div>
      <AdjustedTrialBalanceList />
    </DefaultLayout>
  );
};

export default UnadjustedTrialBalance;