import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import BranchLists from './components/BranchLists';
import './styles.css';

export const metadata = {
  title: "Branch Setup",
  description: "This is Next.js Profile page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
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
