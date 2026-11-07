import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import CollectionList from './components/CollectionList';
import './styles.css';

export const metadata = {
  title: "Posted Payments",
  description: "",
};

const CollectionsList: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Posted Payments" />
      </div>
      <CollectionList />
    </DefaultLayout>
  );
};

export default CollectionsList;
