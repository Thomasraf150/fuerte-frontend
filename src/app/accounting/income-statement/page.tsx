import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import IncomeStatementList from './components/IncomeStatementList';

export const metadata = {
  title: "Income Statement",
  description: "",
};

const GeneralLedger: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Income Statement" />
      </div>
      <IncomeStatementList />
    </DefaultLayout>
  );
};

export default GeneralLedger;