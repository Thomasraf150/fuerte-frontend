import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import VendorsList from './components/VendorsList';

export const metadata = {
  title: "Vendors",
  description: "",
};

// ?type=<vendor type id> keeps the chosen vendor type across Back and refresh.
const Vendor = ({ searchParams }: { searchParams: { type?: string } }) => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Vendors" />
      </div>
      <VendorsList initialType={searchParams?.type ?? ''} />
    </DefaultLayout>
  );
};

export default Vendor;
