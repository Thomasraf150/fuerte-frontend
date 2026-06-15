"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

// Roles allowed to view consolidated financial reports (e.g. Balance Sheet).
// Mirrors the backend BranchAccessService::canViewAllBranchReports() policy:
// Admin, Owner, Accounting. Everyone else is redirected (and the backend also
// denies the data with "Unauthorized: insufficient access").
const ALLOWED_ROLE_CODES = ['ADM', 'OWN', 'ACCTG'];

interface ReportGuardProps {
  children: ReactNode;
}

const ReportGuard: React.FC<ReportGuardProps> = ({ children }) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let roleCode: string | undefined;
      try {
        roleCode = JSON.parse(localStorage.getItem('authStore') ?? '{}')?.state?.user?.role?.code;
      } catch {
        roleCode = undefined; // malformed authStore → treat as unauthorized
      }

      if (ALLOWED_ROLE_CODES.includes(roleCode as string)) {
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

export default ReportGuard;
