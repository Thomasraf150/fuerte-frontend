import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import GeneralVoucherList from './components/GeneralVoucherList';

export const metadata = {
  title: "General Voucher",
  description: "",
};

const GeneralVoucher: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="General Voucher" />
      </div>
      <GeneralVoucherList />
    </DefaultLayout>
  );
};

export default GeneralVoucher;