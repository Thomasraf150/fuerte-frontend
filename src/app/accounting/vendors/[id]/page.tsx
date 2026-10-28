import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import '../styles.css';
import VendorFormPage from '../components/VendorFormPage';

// The tab's fallback until the vendor loads and names itself.
export const metadata = {
  title: "Vendors",
  description: "",
};

const EditVendor = ({ params }: { params: { id: string } }) => (
  <DefaultLayout>
    <VendorFormPage vendorId={params.id} />
  </DefaultLayout>
);

export default EditVendor;
