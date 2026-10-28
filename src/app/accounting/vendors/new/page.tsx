import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import '../styles.css';
import VendorFormPage from '../components/VendorFormPage';

export const metadata = {
  title: "New Vendor",
  description: "",
};

// ?type=<vendor type id>: the form follows the vendor type picked on the list.
const NewVendor = ({ searchParams }: { searchParams: { type?: string } }) => (
  <DefaultLayout>
    <VendorFormPage typeId={searchParams?.type ?? ''} />
  </DefaultLayout>
);

export default NewVendor;
