import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import UserLists from './components/UserLists';
import './styles.css';

export const metadata = {
  title: "Users Setup",
  description: "This is Next.js Profile page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const UsersSetup: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Users Setup" />
      </div>
      <UserLists />
    </DefaultLayout>
  );
};

export default UsersSetup;
