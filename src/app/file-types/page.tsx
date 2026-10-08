import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import NotReadyPanel from '@/components/NotReadyPanel';
import './styles.css';

export const metadata = {
  title: "File Types",
  description: "",
};

const FileTypes: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="File Types" />
        <NotReadyPanel />
      </div>
    </DefaultLayout>
  );
};

export default FileTypes;
