import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import '../styles.css';
import LoanProcSettingsFormPage from '../components/LoanProcSettingsFormPage';

// The tab's fallback until the mapping loads and names its branch.
export const metadata = {
  title: "Loan Proceed Settings",
  description: "",
};

// branch: a branch_sub_id, or 'global' for the Global Default rows.
const EditLoanProceedSetting = ({ params }: { params: { branch: string } }) => (
  <DefaultLayout>
    <LoanProcSettingsFormPage branchKey={params.branch} />
  </DefaultLayout>
);

export default EditLoanProceedSetting;
