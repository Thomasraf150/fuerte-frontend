

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import CompanyProfileForm from './CompanyProfileForm';
import { Card, CardBody, CardHeader } from '@/components/Card';

export const metadata = {
  title: "Company Profile",
  description: "This is Next.js Profile page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const CompanyProfile: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Company Profile" />
      </div>
      <div className="max-w-3xl">
        <div className="grid gap-8">
          <div className="col-span-3 xl:col-span-3">
            <Card>
              <CardHeader title="Company Information" />
              <CardBody>
                <CompanyProfileForm />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default CompanyProfile;
