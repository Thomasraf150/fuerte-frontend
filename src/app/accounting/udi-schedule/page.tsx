import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import UdiScheduleList from './components/UdiScheduleList';

export const metadata = {
  title: "UDI Schedule",
  description: "",
};

const UdiSchedule: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="UDI Schedule" />
      </div>
      <UdiScheduleList />
    </DefaultLayout>
  );
};

export default UdiSchedule;