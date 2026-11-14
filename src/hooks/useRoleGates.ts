"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Accounting, Admin and Owner: who may cancel or edit a voucher (backend App\Support\VoucherEditors,
 * Q40(a) answered 2026-11-13). Payment reversal is not gated by this set.
 */
export const VOUCHER_EDITOR_ROLE_CODES: ReadonlySet<string> = new Set(['ACCTG', 'ADM', 'OWN']);

/**
 * Admin, Branch Admin and Owner: who may delete master data (backend App\Support\MasterDataDeletes,
 * Q40(c) answered 2026-11-13).
 */
export const MASTER_DATA_DELETER_ROLE_CODES: ReadonlySet<string> = new Set(['ADM', 'BRADM', 'OWN']);

/**
 * Whether the signed-in user's role is in $codes; null until the role has been read. Read after
 * mount: the persisted auth store only exists in the browser, never during SSR. Callers show the
 * control only on `=== true`, so it never flashes for a role the server would refuse.
 */
export const useHasRole = (codes: ReadonlySet<string>): boolean | null => {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    setAllowed(codes.has(useAuthStore.getState().user?.role?.code));
  }, [codes]);
  return allowed;
};

export const useCanEditVouchers = (): boolean | null => useHasRole(VOUCHER_EDITOR_ROLE_CODES);
export const useCanDeleteMasterData = (): boolean | null => useHasRole(MASTER_DATA_DELETER_ROLE_CODES);
