import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import CashPositionList from './components/CashPositionList';

export const metadata = {
  title: "Cash Position",
  description: "",
};

const CashPosition: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Cash Position" />
      </div>
      <CashPositionList />
    </DefaultLayout>
  );
};

export default CashPosition;