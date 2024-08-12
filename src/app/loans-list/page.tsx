import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import LoansLists from './components/LoansLists';

export const metadata = {
  title: "Loan Products",
  description: "",
};

const LoansList: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Loans List" />
      </div>
      <LoansLists />
    </DefaultLayout>
  );
};

export default LoansList;
