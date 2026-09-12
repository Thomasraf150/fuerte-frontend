"use client"

import { useEffect, useState } from 'react';
import CoaQueryMutations from '@/graphql/CoaQueryMutations';
import { graphqlFetch } from '@/utils/graphqlFetch';
import { DataCoaGroupView } from '@/utils/DataTypes';

const NOTHING_HIDDEN: ReadonlySet<string> = new Set();

/**
 * The Chart of Accounts page's group view: the logged-in user's group
 * (FA/FB/FC/FD) and the accounts that page hides for them. Page rule only;
 * the account pickers keep reading the full chart through useCoa.
 *
 * Any failure resolves to "no group", which shows every account. That is the
 * safe outcome for a clutter filter, so it logs instead of toasting.
 */
const useCoaGroupView = () => {
  const [groupCode, setGroupCode] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(NOTHING_HIDDEN);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const result = await graphqlFetch(CoaQueryMutations.COA_GROUP_VIEW_QUERY, {});
        const view: DataCoaGroupView | undefined = result?.data?.getCoaGroupView;
        if (result?.errors || !view) {
          console.error('Could not load the COA group view:', result?.errors ?? result);
          return;
        }
        if (!cancelled) {
          setGroupCode(view.group_code);
          setHiddenIds(new Set(view.hidden_account_ids.map(String)));
        }
      } catch (error) {
        console.error('Could not load the COA group view:', error);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return { groupCode, hiddenIds };
};

export default useCoaGroupView;
