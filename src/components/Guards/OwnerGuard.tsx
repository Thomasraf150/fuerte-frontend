"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import SkeletonBlock from "@/components/LoadingStates/SkeletonBlock";

interface OwnerGuardProps {
  children: ReactNode;
}

const OwnerGuard: React.FC<OwnerGuardProps> = ({ children }) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      const userData = JSON.parse(storedAuthStore)['state'];
      const roleCode = userData?.user?.role?.code;

      if (roleCode === 'OWN') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        router.replace('/');
      }
    }
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="mx-auto w-full max-w-md p-6">
        <SkeletonBlock rows={3} label="Checking access…" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};

export default OwnerGuard;
