import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import LoanCalculator from './components/LoanCalculator';

export const metadata = {
  title: 'Loan Calculator',
  description: 'Quote a loan for a borrower at the counter. Nothing is saved.',
};

const LoanCalculatorPage: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto lc-no-print">
        <Breadcrumb pageName="Loan Calculator" />
      </div>
      <LoanCalculator />
    </DefaultLayout>
  );
};

export default LoanCalculatorPage;
