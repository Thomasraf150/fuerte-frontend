import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import BorrowerCompaniesList from './components/BorrowerCompaniesList';
import './styles.css';

export const metadata = {
  title: "Companies",
  description: "",
};

const Companies: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Companies" />
      </div>
      <BorrowerCompaniesList />
    </DefaultLayout>
  );
};

export default Companies;
