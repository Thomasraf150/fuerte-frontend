import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import BorrowerProblemAccountsList from './components/BorrowerProblemAccountsList';

export const metadata = {
  title: 'Problem Accounts - Borrower Detail',
  description: '',
};

interface PageProps {
  params: { borrowerId: string };
}

const BorrowerProblemAccountsPage: React.FC<PageProps> = ({ params }) => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Problem Accounts - Borrower Detail" />
      </div>
      <BorrowerProblemAccountsList borrowerId={params.borrowerId} />
    </DefaultLayout>
  );
};

export default BorrowerProblemAccountsPage;
