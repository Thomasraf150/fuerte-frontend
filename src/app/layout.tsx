"use client";
import "jsvectormap/dist/css/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-toastify/dist/ReactToastify.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import CallCenterGuard from "@/components/Guards/CallCenterGuard";
import './styles.css'; // Include your global styles
import { Fraunces, Hanken_Grotesk } from 'next/font/google';
import { BRAND } from '@/utils/brandColors';
import Pusher from "pusher-js";
import { usePathname } from "next/navigation";
import { useRouter } from 'nextjs-toploader/app';
import useMaintenanceRedirect from '@/hooks/useMaintenanceRedirect';
import NextTopLoader from 'nextjs-toploader';
import { ToastContainer } from 'react-toastify';


// Brand theme 2026-10-05: Hanken Grotesk for the UI and body text (was Poppins), and
// Fraunces 600 for page titles and record names (Tailwind `font-display`).
const sans = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
});

const display = Fraunces({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-display',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  // const pathname = usePathname();

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
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <title>Fuerte Lending System</title>
      </head>
      <body suppressHydrationWarning={true} className={`${sans.variable} ${display.variable}`}>
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
      </body>
    </html>
  );
}
