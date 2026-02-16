"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
        <span className="text-gray-600 dark:text-gray-300">Checking access...</span>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};

export default OwnerGuard;
