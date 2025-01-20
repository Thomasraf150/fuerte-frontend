"use client";
import "jsvectormap/dist/css/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import './styles.css'; // Include your global styles
import { Poppins } from 'next/font/google';

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

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, [loading]);

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
