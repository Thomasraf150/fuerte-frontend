import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import '../styles.css';
import AEFormPage from '../components/AEFormPage';

// The tab's fallback until the entry loads and names its reference.
export const metadata = {
  title: "Adjusting Entries",
  description: "",
};

const AdjustingEntryPage = ({ params }: { params: { entryId: string } }) => (
  <DefaultLayout>
    <AEFormPage entryId={params.entryId} />
  </DefaultLayout>
);

export default AdjustingEntryPage;
