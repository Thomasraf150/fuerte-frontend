"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { RowAcctgEntry, DataGLRow } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';
import { useRouter, usePathname } from 'next/navigation';
import AdminQueryMutations from '@/graphql/AdminQueryMutations';
import { fetchWithRecache } from '@/utils/helper';

const useMaintenanceRedirect = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { GET_MAINTENANCE_MODE } = AdminQueryMutations;

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: GET_MAINTENANCE_MODE,
          }),
        });
        if (response.data.maintenance.data.isMaintenanceModeOn === 1) {
          router.push('/maintenance');
        }
      } catch (error) {
        console.error('Maintenance check failed:', error);
      }
    };

    checkMaintenance();
  }, [pathname, router]);
  
};

export default useMaintenanceRedirect;