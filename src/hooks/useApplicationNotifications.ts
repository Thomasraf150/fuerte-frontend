"use client";

import { useEffect, useState } from 'react';
import LoanApplicationQueries from '@/graphql/LoanApplicationQueries';
import { graphqlFetch } from '@/utils/graphqlFetch';
import type { ApplicationNotification } from '@/utils/DataTypes';

/** How often the header bell asks again, for both of its producers: the deletion approvals and the Applications items. */
export const POLL_MS = 30_000;

/** One empty list, so clearing an empty list does not render again. */
const NONE: ApplicationNotification[] = [];

/**
 * The server's list, or an Error saying why there is none. An answer without the field is not
 * "nothing new": it is a failure, and the bell keeps what it has.
 */
async function fetchNotifications(): Promise<ApplicationNotification[]> {
  const result = await graphqlFetch<{ getApplicationNotifications?: ApplicationNotification[] | null }>(
    LoanApplicationQueries.GET_APPLICATION_NOTIFICATIONS,
  );
  if (result.errors?.length) throw new Error(result.errors[0]?.message || 'The server refused the request.');
  const list = result.data?.getApplicationNotifications;
  if (!Array.isArray(list)) throw new Error('The answer had no getApplicationNotifications.');
  return list;
}

/**
 * The header bell's Applications items: asked when `enabled` first holds (the bell enables it for
 * Processing and Call Center, and only while there is a token: graphqlFetch signs the user out on
 * "Unauthenticated."), then every POLL_MS. The server decides what each user gets.
 *
 * Best-effort, like the deletion badge: a failed request or an answer without the field keeps the
 * last list and shows the user nothing. Only the first failure of a run is logged, with its message
 * alone (the items carry names; a log never does), so a backend that is down is not reported every
 * 30 seconds; a poll that answers ends the run. Turned off or unmounted, it stops asking, and turned
 * off it clears the list. `userId` is whose list it is: another account signed in on the same tab
 * clears the list at once and asks again, so one user never sees another's items.
 */
const useApplicationNotifications = (enabled: boolean, userId: number | string | null | undefined): ApplicationNotification[] => {
  const [items, setItems] = useState<ApplicationNotification[]>(NONE);

  useEffect(() => {
    // A new user (or none) starts from nothing, never from the last user's list.
    setItems(NONE);
    if (!enabled) return;
    let live = true; // turned off, unmounted, or React's dev double mount: a late answer is dropped
    let failing = false;
    const load = (): void => {
      fetchNotifications().then(
        (list) => {
          if (!live) return;
          failing = false;
          setItems(list);
        },
        (error: unknown) => {
          if (!live || failing) return;
          failing = true;
          console.warn('[useApplicationNotifications] the bell could not load its Applications items, and keeps the last list', {
            message: error instanceof Error ? error.message : String(error),
          });
        },
      );
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [enabled, userId]);

  return items;
};

export default useApplicationNotifications;
