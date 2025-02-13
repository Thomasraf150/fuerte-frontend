import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import DebitMemoList from './components/DebitMemoList';

export const metadata = {
  title: "Debit Memo",
  description: "",
};

const DebitMemo: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Debit Memo" />
      </div>
      <DebitMemoList />
    </DefaultLayout>
  );
};

export default DebitMemo;