import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';

export const metadata = {
  title: "Other Company Charges",
  description: "",
};

const OtherCompanyCharges: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Other Company Charges" />
      </div>
    </DefaultLayout>
  );
};

export default OtherCompanyCharges;
