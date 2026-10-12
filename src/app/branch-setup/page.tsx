import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import BranchLists from './components/BranchLists';
import './styles.css';

export const metadata = {
  title: "Branch Setup",
  description: "Set up Fuerte branches and sub-branches.",
};

const BranchSetup: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Branch Setup" />
      </div>
      <BranchLists />
    </DefaultLayout>
  );
};

export default BranchSetup;
