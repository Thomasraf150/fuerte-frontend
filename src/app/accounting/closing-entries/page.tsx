import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import ClosingEntriesList from './components/ClosingEntriesList';

export const metadata = {
  title: "Closing Entries",
  description: "",
};

const ClosingEntries: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Closing Entries" />
      </div>
      <ClosingEntriesList />
    </DefaultLayout>
  );
};

export default ClosingEntries;