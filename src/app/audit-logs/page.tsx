import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import AuditLogList from './components/AuditLogList';
import './styles.css';

export const metadata = {
  title: "Areas",
  description: "",
};

const AuditLogs: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Audit Logs" />
      </div>
      <AuditLogList />
    </DefaultLayout>
  );
};

export default AuditLogs;
  