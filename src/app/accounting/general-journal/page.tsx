import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import GeneralJournalList from './components/GeneralJournalList';

export const metadata = {
  title: "General Journal",
  description: "",
};

const GeneralJournal: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="General Journal" />
      </div>
      <GeneralJournalList />
    </DefaultLayout>
  );
};

export default GeneralJournal;