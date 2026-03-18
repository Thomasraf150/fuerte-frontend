"use client";

import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import LoanTypeList from './components/LoanTypeList';

const LoanTypes: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Loan Types" />
      </div>
      <LoanTypeList />
    </DefaultLayout>
  );
};

export default LoanTypes;
