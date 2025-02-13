import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import CommissionScheduleList from './components/CommissionScheduleList';

export const metadata = {
  title: "Commission Schedule",
  description: "",
};

const ComSchedule: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Commission Schedule" />
      </div>
      <CommissionScheduleList />
    </DefaultLayout>
  );
};

export default ComSchedule;