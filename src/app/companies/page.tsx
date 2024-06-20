import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
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
    </DefaultLayout>
  );
};

export default Companies;
