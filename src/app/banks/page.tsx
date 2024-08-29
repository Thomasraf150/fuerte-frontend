import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import BankList from './components/BankList';

export const metadata = {
  title: "Banks",
  description: "",
};

const Banks: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Banks" />
      </div>
      <BankList />
    </DefaultLayout>
  );
};

export default Banks;
