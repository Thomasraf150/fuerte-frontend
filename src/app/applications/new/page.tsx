import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import NewApplication from '../components/NewApplication';

export const metadata = {
  title: "New application",
  description: "",
};

/** Staff type in an application from Facebook, a walk-in or a call. withAuth comes with DefaultLayout. */
const NewApplicationPage: React.FC = () => {
  return (
    <DefaultLayout>
      <NewApplication />
    </DefaultLayout>
  );
};

export default NewApplicationPage;
