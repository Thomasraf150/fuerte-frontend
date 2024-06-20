import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';

export const metadata = {
  title: "Chiefs",
  description: "",
};

const Chiefs: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Chiefs" />
      </div>
    </DefaultLayout>
  );
};

export default Chiefs;
  