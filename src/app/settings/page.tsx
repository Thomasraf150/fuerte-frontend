import React from 'react';
import { Metadata } from 'next';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import NotReadyPanel from '@/components/NotReadyPanel';

export const metadata: Metadata = {
  title: "Settings",
  description: 'Fuerte Made Easy',
};

/**
 * Until 2026-10-08 this was the TailAdmin template's "Personal Information" demo: sample names and
 * a form that posted to "#", so Save did nothing. It shows the not-ready panel instead (Rafael's
 * Decision 4); the user menu's "Account Settings" still links here.
 */
const Settings: React.FC = () => (
  <DefaultLayout>
    <div className="mx-auto">
      <Breadcrumb pageName="Settings" />
      <NotReadyPanel />
    </div>
  </DefaultLayout>
);

export default Settings;
