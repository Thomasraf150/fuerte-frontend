import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import LoanProceedSettingsList from './components/LoanProceedSettingsList';

export const metadata = {
  title: "Loan Proceed Settings",
  description: "",
};

const LoanProceedSettings: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Loan Proceed Settings" />
      </div>
      <LoanProceedSettingsList />
    </DefaultLayout>
  );
};

export default LoanProceedSettings;