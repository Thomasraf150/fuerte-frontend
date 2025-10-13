"use client";
import "jsvectormap/dist/css/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "react-datepicker/dist/react-datepicker.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import './styles.css'; // Include your global styles
import { Poppins } from 'next/font/google';
import Pusher from "pusher-js";
import { useRouter, usePathname } from "next/navigation";
import useMaintenanceRedirect from '@/hooks/useMaintenanceRedirect';


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
    <html lang="en">
      <body suppressHydrationWarning={true} className={poppins.variable}>
        <div className="dark:bg-boxdark-2 dark:text-bodydark">
          {loading ? <Loader /> : ''}
          {children}
        </div>
      </body>
    </html>
  );
}
