import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import '../styles.css';
import LoanProcSettingsFormPage from '../components/LoanProcSettingsFormPage';

export const metadata = {
  title: "New Loan Proceed Setting",
  description: "",
};

const NewLoanProceedSetting: React.FC = () => (
  <DefaultLayout>
    <LoanProcSettingsFormPage />
  </DefaultLayout>
);

export default NewLoanProceedSetting;
