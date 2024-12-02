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
      <div className="mx-auto">
        <Breadcrumb pageName="Notes Receivable" />
      </div>
      <BorrNrSchedList />
    </DefaultLayout>
  );
};

export default SOA;
