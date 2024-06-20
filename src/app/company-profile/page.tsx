

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import CompanyProfileForm from './CompanyProfileForm';

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
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Company Information
                </h3>
              </div>
              <div className="p-7">
                <CompanyProfileForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default CompanyProfile;
