import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';

export const metadata = {
  title: "Banks",
  description: "",
};

const Banks: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Banks" />
      </div>
    </DefaultLayout>
  );
};

export default Banks;
