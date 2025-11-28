"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/store";
import DashboardQueries from "@/graphql/DashboardQueryMutations";
import {
  AccountingDashboard,
  PeriodOption,
} from "@/types/dashboard";

interface UseAccountingDashboardReturn {
  data: AccountingDashboard | null;
  loading: boolean;
  error: string | null;
  period: PeriodOption;
  setPeriod: (period: PeriodOption) => void;
  selectedBranchId: number | null;
  setSelectedBranchId: (id: number | null) => void;
  refetch: () => void;
  isAdmin: boolean;
  customStartDate: string;
  customEndDate: string;
  setCustomDateRange: (startDate: string, endDate: string) => void;
}

/**
 * Calculate start and end dates based on selected period.
 * For 'custom' period, uses provided custom dates.
 */
const getDateRange = (
  period: PeriodOption,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } => {
  // Handle custom date range
  if (period === "custom" && customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd };
  }

  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "1month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "3months":
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "6months":
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "12months":
      startDate.setMonth(startDate.getMonth() - 12);
      break;
    case "custom":
      // Default to 3 months if custom dates not yet selected
      startDate.setMonth(startDate.getMonth() - 3);
      break;
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
};

/**
 * Hook for fetching accounting dashboard data.
 */
const useAccountingDashboard = (): UseAccountingDashboardReturn => {
  const { GET_ACCOUNTING_DASHBOARD } = DashboardQueries;

  const [data, setData] = useState<AccountingDashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodOption>("3months");
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Handler for setting custom date range
  const setCustomDateRange = useCallback((start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  }, []);

  // Check if user is admin (role_id = 1 or role name contains ADMIN)
  const checkIsAdmin = (): boolean => {
    const { user } = useAuthStore.getState();
    if (!user || !user.roles) return false;

    // Check if any role name contains "ADMIN"
    return user.roles.some(
      (role: any) =>
        role.name?.toUpperCase().includes("ADMIN") || role.id === 1
    );
  };

  const isAdmin = checkIsAdmin();

  const fetchDashboardData = useCallback(async () => {
    const { GET_AUTH_TOKEN } = useAuthStore.getState();
    const token = GET_AUTH_TOKEN();

    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: GET_ACCOUNTING_DASHBOARD,
          variables: {
            branch_id: selectedBranchId,
            start_date: startDate,
            end_date: endDate,
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        const errorMessage = result.errors[0]?.message || "Failed to fetch dashboard data";
        console.error("GraphQL Errors:", result.errors);
        setError(errorMessage);
        setData(null);
      } else if (result.data?.getAccountingDashboard) {
        setData(result.data.getAccountingDashboard);
      } else {
        setError("Invalid response from server");
        setData(null);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Network error. Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, selectedBranchId, customStartDate, customEndDate, GET_ACCOUNTING_DASHBOARD]);

  // Fetch data when period or branch changes
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    period,
    setPeriod,
    selectedBranchId,
    setSelectedBranchId,
    refetch: fetchDashboardData,
    isAdmin,
    customStartDate,
    customEndDate,
    setCustomDateRange,
  };
};

export default useAccountingDashboard;
