import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import BorrNrSchedList from './components/BorrNrSchedList';

export const metadata = {
  title: "Loan Products",
  description: "",
};

const SOA: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
        <Breadcrumb pageName="Notes Receivable" />
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <BorrNrSchedList />
      </div>
    </DefaultLayout>
  );
};

export default SOA;
