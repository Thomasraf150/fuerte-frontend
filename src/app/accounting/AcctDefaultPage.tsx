"use client";

import React, { useEffect, useState } from "react";
import useAccountingDashboard from "@/hooks/useAccountingDashboard";
import NrUdiSummary from "@/components/Dashboard/components/NrUdiSummary";
import NrUdiTrendChart from "@/components/Dashboard/components/NrUdiTrendChart";
import SubBranchBreakdownTable from "@/components/Dashboard/components/SubBranchBreakdownTable";
import DateRangePicker from "@/components/FormElements/DatePicker/DateRangePicker";
import { PeriodOption } from "@/types/dashboard";
import { useAuthStore } from "@/store";
import BranchQueryMutations from "@/graphql/BranchQueryMutation";
import { graphqlFetch } from "@/utils/graphqlFetch";
import ReactSelect from "@/components/ReactSelect";
import { SelectOption } from "@/utils/DataTypes";

// "" means "no branch filter" — a real option so the control never renders blank.
const ALL_BRANCHES_OPTION: SelectOption = { value: "", label: "All Branches" };

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
    customStartDate,
    customEndDate,
    setCustomDateRange,
  } = useAccountingDashboard();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  // Offer the branch filter to anyone who can actually reach more than one
  // sub-branch, not just Owner. GROUP_ADMIN and BRANCH_ADMIN were shown a bare
  // 'Viewing: All Branches' with no control to narrow it.
  const [canPickBranch, setCanPickBranch] = useState(false);

  // "" means no branch filter; kept as a real option so the control never blanks.
  const branchOptions: SelectOption[] = React.useMemo(
    () => [ALL_BRANCHES_OPTION, ...branches.map((b) => ({ value: String(b.id), label: b.name }))],
    [branches],
  );

  useEffect(() => {
    const { user } = useAuthStore.getState() as any;
    setIsOwner(user?.role?.code === 'OWN');
    const assigned = Array.isArray(user?.assignedBranchSubIds) ? user.assignedBranchSubIds : [];
    setCanPickBranch(user?.role?.code === 'OWN' || assigned.length > 1);
  }, []);

  // Fetch branches for admin dropdown
  useEffect(() => {
    const fetchBranches = async () => {
      if (!canPickBranch) return;

      setBranchesLoading(true);

      try {
        const result = await graphqlFetch(
          BranchQueryMutations.GET_BRANCH_QUERY,
          { orderBy: "name_asc" },
        );
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
  }, [canPickBranch]);

  const periodOptions: { value: PeriodOption; label: string }[] = [
    { value: "1month", label: "Last 1 Month" },
    { value: "3months", label: "Last 3 Months" },
    { value: "6months", label: "Last 6 Months" },
    { value: "12months", label: "Last 12 Months" },
    { value: "custom", label: "Custom Range" },
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
          Viewing: {data?.viewing_branch?.branch_name || "Loading..."}
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

          {/* Custom Date Range Picker */}
          {period === "custom" && (
            <DateRangePicker
              startDate={customStartDate}
              endDate={customEndDate}
              onChange={setCustomDateRange}
            />
          )}

          {/* Branch Selector (Owner Only) */}
          {canPickBranch && (
            <div className="min-w-[200px]">
              <ReactSelect
                aria-label="Filter by branch"
                options={branchOptions}
                value={
                  branchOptions.find(
                    (o) => o.value === String(selectedBranchId ?? "")
                  ) ?? ALL_BRANCHES_OPTION
                }
                onChange={(option) =>
                  setSelectedBranchId(option?.value ? parseInt(option.value) : null)
                }
                placeholder="All Branches"
                isDisabled={branchesLoading}
                isLoading={branchesLoading}
                loadingMessage={() => "Loading branches..."}
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {data?.summary ? (
        <NrUdiSummary summary={data.summary} previous={data.previous} loading={loading} isOwner={isOwner} />
      ) : (
        <NrUdiSummary
          summary={{
            total_nr: "0",
            total_udi: "0",
            total_outstanding: "0",
            total_cash_out: "0",
            active_loan_count: "0",
            nr_change_percent: "0",
            udi_change_percent: "0",
            loan_count_change_percent: "0",
            outstanding_change_percent: "0",
            cash_out_change_percent: "0",
          }}
          loading={loading}
          isOwner={isOwner}
        />
      )}

      {/* Charts and Tables */}
      {isOwner ? (
        <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
          <NrUdiTrendChart trend={data?.trend || []} loading={loading} />
          <SubBranchBreakdownTable
            breakdown={data?.sub_branch_breakdown || []}
            loading={loading}
            isOwner={isOwner}
          />
        </div>
      ) : (
        <div className="mt-4">
          <SubBranchBreakdownTable
            breakdown={data?.sub_branch_breakdown || []}
            loading={loading}
            fullWidth
            isOwner={isOwner}
          />
        </div>
      )}
    </>
  );
};

export default AcctDefaultPage;
