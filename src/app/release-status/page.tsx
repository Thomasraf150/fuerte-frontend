import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import ReleaseStatusHome from './components/ReleaseStatusHome';

export const metadata = {
  title: 'Release Status',
  description: '',
};

const ReleaseStatusPage: React.FC = () => (
  <DefaultLayout>
    <div className="mx-auto">
      <Breadcrumb pageName="Release Status" />
    </div>
    <ReleaseStatusHome />
  </DefaultLayout>
);

export default ReleaseStatusPage;
