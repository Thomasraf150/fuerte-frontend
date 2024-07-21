import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import SubAreaList from './components/SubAreaList';
import './styles.css';

export const metadata = {
  title: "Areas",
  description: "",
};

const SubArea: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Area" />
      </div>
      <SubAreaList />
    </DefaultLayout>
  );
};

export default SubArea;
  