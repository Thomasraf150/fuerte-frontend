import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import AtmCollectionsHome from './components/AtmCollectionsHome';

export const metadata = {
  title: 'ATM Collections',
  description: '',
};

const AtmCollectionsPage: React.FC = () => (
  <DefaultLayout>
    <div className="mx-auto">
      <Breadcrumb pageName="ATM Collections" />
    </div>
    <AtmCollectionsHome />
  </DefaultLayout>
);

export default AtmCollectionsPage;
