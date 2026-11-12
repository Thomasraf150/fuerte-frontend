"use client";

import { useEffect, useState } from 'react';
import { graphqlFetch } from '@/utils/graphqlFetch';
import { MY_APP_NOTIFICATIONS, type AppNotice } from '@/graphql/AtmCollectionQueries';
import { POLL_MS } from '@/hooks/useApplicationNotifications';

const NONE: AppNotice[] = [];

/**
 * The header bell's collections notices (refund ready, fully paid, branch Red, funds request,
 * OPEX replenishment to approve), the last 30 days, newest first. Polled like the other bell
 * sources; a failed poll keeps the last list and logs once, without the notice text.
 */
const useAppNotices = (enabled: boolean, userId: number | string | null | undefined): AppNotice[] => {
  const [items, setItems] = useState<AppNotice[]>(NONE);

  useEffect(() => {
    setItems(NONE);
    if (!enabled) return;
    let live = true;
    let failing = false;
    const load = (): void => {
      graphqlFetch<{ myAppNotifications?: AppNotice[] }>(MY_APP_NOTIFICATIONS).then(
        (res) => {
          if (!live) return;
          const list = res.data?.myAppNotifications;
          if (Array.isArray(list)) { failing = false; setItems(list); return; }
          if (!failing) { failing = true; console.warn('[useAppNotices] the bell could not load its collections notices'); }
        },
        () => {
          if (live && !failing) { failing = true; console.warn('[useAppNotices] the bell could not load its collections notices'); }
        },
      );
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => { live = false; clearInterval(timer); };
  }, [enabled, userId]);

  return items;
};

export default useAppNotices;
