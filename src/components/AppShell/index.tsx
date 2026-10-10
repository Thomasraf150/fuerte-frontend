"use client";

import React, { useEffect, useState } from "react";
import Pusher from "pusher-js";
import { usePathname } from "next/navigation";
import { useRouter } from 'nextjs-toploader/app';
import NextTopLoader from 'nextjs-toploader';
import { ToastContainer } from 'react-toastify';
import Loader from "@/components/common/Loader";
import CallCenterGuard from "@/components/Guards/CallCenterGuard";
import useMaintenanceRedirect from '@/hooks/useMaintenanceRedirect';
import { BRAND } from '@/utils/brandColors';

/**
 * Everything live in the app's frame, moved verbatim out of the root layout (2026-10-10) so that
 * layout can be a Server Component: only a server layout may export `metadata`, which carries the
 * tab-title pattern "{page} · Fuerte Lending" and the castle favicon. Behaviour is unchanged:
 * maintenance redirect, the Pusher maintenance channel, the top loading bar, the first-load
 * loader, the Call Center guard and the app's one toast container.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState<boolean>(true);

  useMaintenanceRedirect();

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, [loading]);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe("system");
    channel.bind("MaintenanceModeChanged", (data: any) => {
      console.log("Maintenance event received!", data);
      if (data.maintenance === true && pathname !== "/maintenance") {
        router.push("/maintenance");
      } else {
        router.push("/");
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [pathname, router]);

  return (
    <>
      {/* Top Loading Bar - Shows during page navigation */}
      <NextTopLoader
        color={BRAND.accent}
        height={3}
        showSpinner={false}
        speed={200}
        crawlSpeed={200}
        easing="ease"
        shadow={`0 0 10px ${BRAND.accent},0 0 5px ${BRAND.accent}`}
      />
      <div className="dark:bg-boxdark-2 dark:text-bodydark">
        {loading ? <Loader /> : ''}
        <CallCenterGuard>{children}</CallCenterGuard>
      </div>
      {/* The app's one toast container. Each page layout used to mount its own, so a toast
          fired just before a page change (a save that returns to the list, sign-in) was
          unmounted with the page that fired it. */}
      {/* Top right, but BELOW the header (Phase 8): at the top they covered the bell, the user menu and
          the phone Menu button; at the bottom they covered the sticky Save bar (StickyActions). */}
      <ToastContainer
        position="top-right"
        style={{ top: '5.5rem' }}
        toastClassName="font-satoshi"
        bodyClassName="font-satoshi"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}
