import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import AreaList from './components/AreaList';
import './styles.css';

export const metadata = {
  title: "Areas",
  description: "",
};

const Area: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Area" />
      </div>
      <AreaList />
    </DefaultLayout>
  );
};

export default Area;
  