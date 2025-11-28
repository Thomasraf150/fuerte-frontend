"use client";

import React, { useEffect, useState } from "react";
import useAccountingDashboard from "@/hooks/useAccountingDashboard";
import NrUdiSummary from "@/components/Dashboard/components/NrUdiSummary";
import NrUdiTrendChart from "@/components/Dashboard/components/NrUdiTrendChart";
import SubBranchBreakdownTable from "@/components/Dashboard/components/SubBranchBreakdownTable";
import { PeriodOption } from "@/types/dashboard";
import { useAuthStore } from "@/store";
import BranchQueryMutations from "@/graphql/BranchQueryMutation";

interface Branch {
  id: number;
  name: string;
}

const AcctDefaultPage: React.FC = () => {
  const {
    data,
    loading,
    error,
    period,
    setPeriod,
    selectedBranchId,
    setSelectedBranchId,
    refetch,
    isAdmin,
  } = useAccountingDashboard();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // Fetch branches for admin dropdown
  useEffect(() => {
    const fetchBranches = async () => {
      if (!isAdmin) return;

      setBranchesLoading(true);
      const { GET_AUTH_TOKEN } = useAuthStore.getState();

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GET_AUTH_TOKEN()}`,
          },
          body: JSON.stringify({
            query: BranchQueryMutations.GET_BRANCH_QUERY,
            variables: { orderBy: "id_asc" },
          }),
        });

        const result = await response.json();
        if (result.data?.getBranch) {
          const activeBranches = result.data.getBranch.filter(
            (b: any) => !b.is_deleted
          );
          setBranches(activeBranches);
        }
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      } finally {
        setBranchesLoading(false);
      }
    };

    fetchBranches();
  }, [isAdmin]);

  const periodOptions: { value: PeriodOption; label: string }[] = [
    { value: "1month", label: "Last Month" },
    { value: "3months", label: "Last 3 Months" },
    { value: "6months", label: "Last 6 Months" },
    { value: "12months", label: "Last 12 Months" },
  ];

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-red-500 text-lg">{error}</div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header with Branch Info and Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Viewing: {data?.viewing_branch?.branch_name || "Loading..."} Branch
        </h2>

        <div className="flex flex-wrap gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodOption)}
            className="rounded border border-stroke bg-white px-4 py-2 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Branch Selector (Admin Only) */}
          {isAdmin && (
            <select
              value={selectedBranchId || ""}
              onChange={(e) =>
                setSelectedBranchId(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              disabled={branchesLoading}
              className="rounded border border-stroke bg-white px-4 py-2 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {data?.summary ? (
        <NrUdiSummary summary={data.summary} loading={loading} />
      ) : (
        <NrUdiSummary
          summary={{
            total_nr: "0",
            total_udi: "0",
            total_outstanding: "0",
            active_loan_count: "0",
            nr_change_percent: "0",
            udi_change_percent: "0",
            loan_count_change_percent: "0",
          }}
          loading={loading}
        />
      )}

      {/* Charts and Tables */}
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        {/* Trend Chart */}
        <NrUdiTrendChart trend={data?.trend || []} loading={loading} />

        {/* Sub-Branch Breakdown Table */}
        <SubBranchBreakdownTable
          breakdown={data?.sub_branch_breakdown || []}
          loading={loading}
        />
      </div>
    </>
  );
};

export default AcctDefaultPage;
