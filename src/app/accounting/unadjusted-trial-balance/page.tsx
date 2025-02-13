import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import UnadjustedTrialBalanceList from './components/UnadjustedTrialBalanceList';

export const metadata = {
  title: "Unadjusted Trial Balance",
  description: "",
};

const UnadjustedTrialBalance: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Unadjusted Trial Balance" />
      </div>
      <UnadjustedTrialBalanceList />
    </DefaultLayout>
  );
};

export default UnadjustedTrialBalance;