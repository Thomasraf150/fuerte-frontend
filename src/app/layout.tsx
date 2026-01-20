"use client";
import "jsvectormap/dist/css/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-toastify/dist/ReactToastify.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import './styles.css'; // Include your global styles
import { Poppins } from 'next/font/google';
import Pusher from "pusher-js";
import { usePathname } from "next/navigation";
import { useRouter } from 'nextjs-toploader/app';
import useMaintenanceRedirect from '@/hooks/useMaintenanceRedirect';
import NextTopLoader from 'nextjs-toploader';


const poppins = Poppins({
  subsets: ['latin'], // Include subsets you need
  weight: ['400', '500', '600', '700'], // Specify weights you want to use
  style: ['normal', 'italic'], // Optional: Add styles like normal/italic
  variable: '--font-poppins', // Use a CSS variable to apply globally
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
      <body suppressHydrationWarning={true} className={poppins.variable}>
        {/* Top Loading Bar - Shows during page navigation */}
        <NextTopLoader
          color="#2563eb"
          height={3}
          showSpinner={false}
          speed={200}
          crawlSpeed={200}
          easing="ease"
          shadow="0 0 10px #2563eb,0 0 5px #2563eb"
        />
        <div className="dark:bg-boxdark-2 dark:text-bodydark">
          {loading ? <Loader /> : ''}
          {children}
        </div>
      </body>
    </html>
  );
}
