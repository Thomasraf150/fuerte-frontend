"use client";

import React, { useState, useEffect } from 'react';
import DefaultPage from "@/components/Dashboard/DefaultPage";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import AcctDefaultPage from "@/app/accounting/AcctDefaultPage";
import Head from "next/head";

// export const metadata: Metadata = {
//   title:
//     "Fuerte Lending",
//   description: "Lending Made Easy",
// };

export default function Home() {
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      setUserData(JSON.parse(storedAuthStore)['state']);
      setIsLoading(false);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Fuerte Lending</title>
        <meta name="description" content="Lending Made Easy" />
      </Head>
      <DefaultLayout>
        {isLoading ? <div>Loading...</div> : (
          userData?.user?.role?.code === 'ACCTG' ? (
            <AcctDefaultPage />
          ) : (
            <DefaultPage />
          )  
        )}
      </DefaultLayout>
    </>
  );
}
