import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import RenewableBorrowersList from './components/RenewableBorrowersList';

export const metadata = {
  title: 'Renewable Borrowers',
  description: '',
};

const RenewableBorrowersPage: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Renewable Borrowers" />
      </div>
      <RenewableBorrowersList />
    </DefaultLayout>
  );
};

export default RenewableBorrowersPage;
