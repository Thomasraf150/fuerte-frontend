import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import NotReadyPanel from '@/components/NotReadyPanel';
import './styles.css';

export const metadata = {
  title: "For New Loans",
  description: "",
};

const ForNewLoans: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="For New Loans" />
        <NotReadyPanel />
      </div>
    </DefaultLayout>
  );
};

export default ForNewLoans;
