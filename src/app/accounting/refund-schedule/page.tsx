import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import RefundScheduleList from './components/RefundScheduleList';

export const metadata = {
  title: "Refund Schedule",
  description: "",
};

const RefundSchedule: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Refund Schedule" />
      </div>
      <RefundScheduleList />
    </DefaultLayout>
  );
};

export default RefundSchedule;