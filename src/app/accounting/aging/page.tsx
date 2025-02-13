import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import AgingList from './components/AgingList';

export const metadata = {
  title: "Aging",
  description: "",
};

const Aging: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Aging" />
      </div>
      <AgingList />
    </DefaultLayout>
  );
};

export default Aging;