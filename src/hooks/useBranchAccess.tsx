"use client";

import { useEffect, useState } from 'react';
import { fetchBranchAccess } from '@/utils/branchAccess';
import type { BranchAccess } from '@/utils/convertApplication';

/**
 * Which branches the signed-in user may create a borrower in (BranchAccess), asked once when
 * `enabled` first holds. "Unknown" until it is known, and for good if the list does not load:
 * nothing is judged on an unknown, so a slow or failed list never stops anyone (the server
 * still refuses what it must). The Owner is "any" without a request.
 */
const useBranchAccess = (enabled: boolean): BranchAccess => {
  const [access, setAccess] = useState<BranchAccess>({ kind: 'unknown' });

  useEffect(() => {
    if (!enabled) return;
    let stale = false; // the page has moved on (React's dev double mount, or leaving)
    fetchBranchAccess().then((found) => {
      if (!stale) setAccess(found);
    });
    return () => {
      stale = true;
    };
  }, [enabled]);

  return access;
};

export default useBranchAccess;
