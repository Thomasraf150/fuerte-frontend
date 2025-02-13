import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import GeneralLedgerList from './components/GeneralLedgerList';

export const metadata = {
  title: "General Ledger",
  description: "",
};

const GeneralLedger: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="General Ledger" />
      </div>
      <GeneralLedgerList />
    </DefaultLayout>
  );
};

export default GeneralLedger;