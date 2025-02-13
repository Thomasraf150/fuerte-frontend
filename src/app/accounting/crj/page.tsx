import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import CrjList from './components/CrjList';

export const metadata = {
  title: "Cash Receipts Journal",
  description: "",
};

const CashReceiptsJournal: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Cash Receipts Journal" />
      </div>
      <CrjList />
    </DefaultLayout>
  );
};

export default CashReceiptsJournal;