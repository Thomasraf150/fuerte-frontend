import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import ChartofAcctList from './components/ChartofAcctList';

export const metadata = {
  title: "Loan Products",
  description: "",
};

const SOA: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Chart of Accounts" />
      </div>
      <ChartofAcctList />
    </DefaultLayout>
  );
};

export default SOA;
