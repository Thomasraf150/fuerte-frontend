import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';

export const metadata = {
  title: "Borrower Process",
  description: "",
};

const BorrowerProcess: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Borrower Process" />
      </div>
    </DefaultLayout>
  );
};

export default BorrowerProcess;
