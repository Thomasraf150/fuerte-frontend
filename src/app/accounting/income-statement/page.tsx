"use client";

import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import OwnerGuard from '@/components/Guards/OwnerGuard';
import './styles.css';
import IncomeStatementList from './components/IncomeStatementList';

const IncomeStatement: React.FC = () => {
  return (
    <DefaultLayout>
      <OwnerGuard>
        <div className="mx-auto">
          <Breadcrumb pageName="Income Statement" />
        </div>
        <IncomeStatementList />
      </OwnerGuard>
    </DefaultLayout>
  );
};

export default IncomeStatement;
