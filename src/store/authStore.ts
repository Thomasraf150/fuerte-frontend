import React from 'react'
import { createStore } from "zustand";
import { persist } from "zustand/middleware";

type TUserRole = {
  id: number;
  name: string;
  email: string;
  roles: { name: string }[];
  branch: any;
};

type TUser = {
  id?: number;
  name?: string;
  email?: string;
  roles?: TUserRole[];
  // The login response can include these — left untyped (any) historically.
  // Don't enforce them here; downstream code uses optional chaining.
  branch_sub_id?: number | null;
  branch_sub?: any;
  branchSub?: any;
  role?: any;
  /**
   * Sub-branches the user can pick from when filing new records (e.g.
   * the Borrower form's branch dropdown). For single-branch users this
   * is [home] (length 1) and the dropdown stays hidden — the home
   * branch is auto-stamped. For multi-branch users it contains home +
   * any explicitly granted sub-branches.
   */
  assignedBranchSubIds?: number[];
};

type TAuthStore = {
  user?: TUser;
  authToken?: string;
  IS_AUTHENTICATED: () => boolean;
  SET_AUTH_DATA: (user: TUser, authToken: string) => void;
  CLEAR_AUTH_DATA: () => void;
  GET_AUTH_TOKEN: () => string | undefined;
};

const initialState = {
  user: { name: "", email: "", roles: [], branch: null },
  authToken: undefined,
};

export const useAuthStore = createStore<TAuthStore>() (
  persist(
    (set, get) => ({
      ...initialState,
      IS_AUTHENTICATED: () => {
        return Boolean(get().authToken !== undefined);
      },
      SET_AUTH_DATA: (user: TUser, authToken: string) => {
        // Defensive fallback for older backend payloads that don't yet
        // ship assignedBranchSubIds — collapse to a single-entry array
        // built from the home branch so downstream code (form dropdowns)
        // sees a consistent shape.
        const assigned = Array.isArray(user.assignedBranchSubIds)
          ? user.assignedBranchSubIds.map((id) => Number(id)).filter((n) => !Number.isNaN(n))
          : (user.branch_sub_id ? [Number(user.branch_sub_id)] : []);

        return set(() => ({
          user: { ...user, assignedBranchSubIds: assigned },
          authToken,
        }));
      },
      CLEAR_AUTH_DATA: () => {
        return set(() => ({
          ...initialState,
        }));
      },
      GET_AUTH_TOKEN: () => {
        return get().authToken;
      },
    }),
    { name: "authStore" },
  ),
);
