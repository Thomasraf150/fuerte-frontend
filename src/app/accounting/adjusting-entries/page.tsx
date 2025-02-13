import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import AdjustingEntriesList from './components/AdjustingEntriesList';

export const metadata = {
  title: "Adjusting Entries",
  description: "",
};

const AdjustingEntries: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Adjusting Entries" />
      </div>
      <AdjustingEntriesList />
    </DefaultLayout>
  );
};

export default AdjustingEntries;