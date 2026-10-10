import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import BorrNrSchedList from './components/BorrNrSchedList';

export const metadata = {
  title: "Notes Receivable",
  description: "",
};

const SOA: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Notes Receivable" />
      </div>
      <div>
        <BorrNrSchedList />
      </div>
    </DefaultLayout>
  );
};

export default SOA;
