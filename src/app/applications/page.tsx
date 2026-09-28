import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import ApplicationList from './components/ApplicationList';

export const metadata = {
  title: "Applications",
  description: "",
};

const Applications: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Applications" />
      </div>
      <ApplicationList />
    </DefaultLayout>
  );
};

export default Applications;
