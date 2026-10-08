"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Admin, Owner and Call Center: who may upload Google Form responses (the backend's
 * ApplicationAccessPolicy::canUpload). On New application they are also the roles that
 * choose the branch (Admin and Owner any; Call Center any of its own group's, 2026-10-08) and may
 * pick "Google Form"; the backend refuses google_form from anyone else.
 */
export const UPLOAD_ROLE_CODES: ReadonlySet<string> = new Set(['ADM', 'OWN', 'CALLCTR']);

/**
 * Whether this user is one of them; null until the role has been read. Read after
 * mount: the persisted auth store only exists in the browser, never during SSR.
 */
export const useCanUpload = (): boolean | null => {
  const [canUpload, setCanUpload] = useState<boolean | null>(null);
  useEffect(() => {
    setCanUpload(UPLOAD_ROLE_CODES.has(useAuthStore.getState().user?.role?.code));
  }, []);
  return canUpload;
};
