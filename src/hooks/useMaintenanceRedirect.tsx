"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { RowAcctgEntry, DataGLRow } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import moment from 'moment';
import { usePathname } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import AdminQueryMutations from '@/graphql/AdminQueryMutations';
import { fetchWithRecache } from '@/utils/helper';
import { useAuthStore } from '@/store';

const useMaintenanceRedirect = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { GET_MAINTENANCE_MODE } = AdminQueryMutations;

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        // Send the token when we have one. The query itself is public (it must
        // work on the signin page), but this probe runs on EVERY page view from
        // the root layout. Unauthenticated, it all lands in the single anonymous
        // per-IP bucket — which Docker NAT makes office-wide — so a busy branch
        // spends that shared budget on maintenance checks. With the token it
        // goes to the user's own bucket instead.
        const token = useAuthStore.getState().GET_AUTH_TOKEN();
        const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    // `router` is deliberately NOT a dependency. useRouter from
    // 'nextjs-toploader/app' builds a fresh object literal on every render (it
    // spreads the Next router and re-creates push/replace, with no useMemo), so
    // listing it here re-fired this effect on every RootLayout re-render — and
    // RootLayout re-renders once on load when its `loading` flag flips. This
    // hook lives in the root layout, so that doubled an UNAUTHENTICATED GraphQL
    // request on every page view app-wide, draining the shared anonymous
    // rate-limit bucket. pathname is the only real dependency; router is called,
    // never compared.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  
};

export default useMaintenanceRedirect;