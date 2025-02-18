import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import VendorsList from './components/VendorsList';

export const metadata = {
  title: "Vendors",
  description: "",
};

const Vendor: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Vendors" />
      </div>
      <VendorsList />
    </DefaultLayout>
  );
};

export default Vendor;