import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import BorrCommSchedList from './components/BorrCommSchedList';

export const metadata = {
  title: "Commission Schedule",
  description: "",
};

const SOA: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Commission Schedule" />
      </div>
      <div>
        <BorrCommSchedList />
      </div>
    </DefaultLayout>
  );
};

export default SOA;
