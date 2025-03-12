import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import BorrowerList from './components/BorrowerList';

export const metadata = {
  title: "Borrowers",
  description: "",
};

const Borrowers: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Borrowers" />
      </div>
      <BorrowerList />
    </DefaultLayout>
  );
};

export default Borrowers;
