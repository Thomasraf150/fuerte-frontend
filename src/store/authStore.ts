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
        return set(() => ({
          user,
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
