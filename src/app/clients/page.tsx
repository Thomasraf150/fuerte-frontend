import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import ClientsList from './components/ClientsList';
import './styles.css';

export const metadata = {
  title: "Clients",
  description: "",
};

const Clients: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Clients" />
      </div>
      <ClientsList />
    </DefaultLayout>
  );
};

export default Clients;
