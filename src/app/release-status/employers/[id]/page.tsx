'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import EmployerHome from '../../components/EmployerHome';

/** One employer from Release Status: /release-status/employers/<company id>. */
const EmployerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <DefaultLayout>
      <EmployerHome id={id} />
    </DefaultLayout>
  );
};

export default EmployerPage;
