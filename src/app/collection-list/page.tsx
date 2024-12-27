import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import CollectionList from './components/CollectionList';
import './styles.css';

export const metadata = {
  title: "Collection List",
  description: "",
};

const CollectionsList: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Collection List" />
      </div>
      <CollectionList />
    </DefaultLayout>
  );
};

export default CollectionsList;
