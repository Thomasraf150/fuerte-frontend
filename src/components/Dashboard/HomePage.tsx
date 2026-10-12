"use client";

import React, { useState, useEffect } from 'react';
import DefaultPage from "@/components/Dashboard/DefaultPage";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import AcctDefaultPage from "@/app/accounting/AcctDefaultPage";
import SkeletonBlock from "@/components/LoadingStates/SkeletonBlock";

/**
 * The "/" page body (moved out of app/page.tsx, 2026-10-12, so that page can be a Server
 * Component and export the tab title; next/head does nothing in the App Router).
 */
export default function HomePage() {
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
    <DefaultLayout>
      {isLoading ? <SkeletonBlock rows={4} label="Loading the dashboard…" /> : (
        userData?.user?.role?.code === 'ACCTG' ? (
          <AcctDefaultPage />
        ) : (
          <DefaultPage />
        )
      )}
    </DefaultLayout>
  );
}
