import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import CdjList from './components/CdjList';

export const metadata = {
  title: "Cash Disbursement Journal",
  description: "",
};

const CashDisbursementJournal: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Cash Disbursement Journal" />
      </div>
      <CdjList />
    </DefaultLayout>
  );
};

export default CashDisbursementJournal;