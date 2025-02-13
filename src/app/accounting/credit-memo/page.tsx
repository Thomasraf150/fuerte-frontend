import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import CreditMemoList from './components/CreditMemoList';

export const metadata = {
  title: "Credit Memo",
  description: "",
};

const CreditMemo: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Credit Memo" />
      </div>
      <CreditMemoList />
    </DefaultLayout>
  );
};

export default CreditMemo;