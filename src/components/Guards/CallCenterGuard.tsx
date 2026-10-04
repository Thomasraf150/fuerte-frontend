"use client";

import React, { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { callCenterTarget } from "@/hoc/withAuth";
import { useAuthStore } from "@/store/authStore";

/** Pages every signed-in user may be on, Call Center included: sign-in, and the maintenance page everyone is sent to. */
const isOpenToAll = (p: string) => p === "/maintenance" || p === "/auth" || p.startsWith("/auth/");

/**
 * Keeps Call Center (CALLCTR, role 8) on the Applications pages, and keeps any other page from
 * being mounted for it. The server refuses a Call Center account everything outside them ("This
 * is not available to Call Center accounts."), and a page asks for its data in its first effects,
 * so a page mounted before the redirect lands is a refusal, and a toast, the user must never see.
 *
 * It sits in the root layout, above every page. The pages draw DefaultLayout (and so withAuth)
 * themselves, and a page such as /borrowers/[id] fetches in its own effects, outside it: nothing
 * inside a page can hold that page back. The role is read from the persisted store itself, which
 * on the client is already hydrated, and not through a hook: a hook answers with the server's view
 * for the hydration pass, and the page's effects would run in that very commit. What it draws
 * meanwhile is DefaultLayout's own loading state, which is what the server drew for every page, so
 * the markup matches. UI routing, NOT a security control.
 */
const CallCenterGuard: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const target = useAuthStore.getState().IS_AUTHENTICATED() && !isOpenToAll(pathname) ? callCenterTarget(pathname) : null;

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (target) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  return <>{children}</>;
};

export default CallCenterGuard;
