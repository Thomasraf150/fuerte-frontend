import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import LoanCodeList from './components/LoanCodeList';
import './styles.css';

export const metadata = {
  title: "Loan Codes",
  description: "",
};

const LoanCodes: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Loan Codes" />
      </div>
      <LoanCodeList />
    </DefaultLayout>
  );
};

export default LoanCodes;
