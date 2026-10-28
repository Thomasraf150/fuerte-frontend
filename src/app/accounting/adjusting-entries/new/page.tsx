import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import '../styles.css';
import AEFormPage from '../components/AEFormPage';

export const metadata = {
  title: "New Adjusting Entry",
  description: "",
};

const NewAdjustingEntry: React.FC = () => (
  <DefaultLayout>
    <AEFormPage />
  </DefaultLayout>
);

export default NewAdjustingEntry;
