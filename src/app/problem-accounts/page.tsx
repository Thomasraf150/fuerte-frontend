import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import ProblemAccountsList from './components/ProblemAccountsList';

export const metadata = {
  title: 'Problem Accounts',
  description: '',
};

const ProblemAccountsPage: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Problem Accounts" />
      </div>
      <ProblemAccountsList />
    </DefaultLayout>
  );
};

export default ProblemAccountsPage;
