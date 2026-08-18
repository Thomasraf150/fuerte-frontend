"use client";

import React, { useEffect, useMemo, useState } from "react";
import BranchQueryMutations from "@/graphql/BranchQueryMutation";
import { useAuthStore } from "@/store";
import ReactSelect from "@/components/ReactSelect";
import { SelectOption } from "@/utils/DataTypes";

/** Sentinel option: empty value === "no branch filter". */
const ALL_BRANCHES_OPTION: SelectOption = { value: "", label: "All Branches" };

interface DateBranchFiltersProps {
  month: number | null;
  year: number | null;
  branchSubId: number | null;
  onMonthChange: (month: number | null) => void;
  onYearChange: (year: number | null) => void;
  onBranchSubIdChange: (branchSubId: number | null) => void;
  onClearFilters: () => void;
}

interface BranchSubData {
  id: number;
  name: string;
}

const DateBranchFilters: React.FC<DateBranchFiltersProps> = ({
  month,
  year,
  branchSubId,
  onMonthChange,
  onYearChange,
  onBranchSubIdChange,
  onClearFilters,
}) => {
  const [branches, setBranches] = useState<BranchSubData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        setError(null);
        const { GET_AUTH_TOKEN } = useAuthStore.getState();

        const response = await fetch(
          process.env.NEXT_PUBLIC_API_GRAPHQL || "http://localhost:8000/fuerte-api",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${GET_AUTH_TOKEN()}`,
            },
            body: JSON.stringify({
              query: BranchQueryMutations.GET_ALL_SUB_BRANCH_QUERY,
              variables: { orderBy: "name_asc" },
            }),
          }
        );

        const result = await response.json();

        // Check for GraphQL errors FIRST
        if (result.errors) {
          const errorMsg = result.errors[0]?.message || "Failed to fetch branches";
          console.error('[DateBranchFilters] GraphQL errors:', result.errors);
          setError(errorMsg);
          return; // Early return prevents bad data
        }

        if (result.data?.getAllBranch) {
          setBranches(result.data.getAllBranch);
        } else {
          setBranches([]);
        }
      } catch (err) {
        console.error('[DateBranchFilters] Failed to fetch branches:', err);
        // Without this the dropdown reports "No branches found" on a network
        // failure, which reads as "there are none" rather than "we could not ask".
        setError(err instanceof Error ? err.message : 'Failed to fetch branches');
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // "All Branches" first, then every sub-branch. Values are strings because
  // SelectOption.value is a string; they're parsed back to numbers on change.
  const branchOptions = useMemo<SelectOption[]>(
    () => [
      ALL_BRANCHES_OPTION,
      ...branches.map((branch) => ({
        value: String(branch.id),
        label: branch.name,
      })),
    ],
    [branches]
  );

  // Never render blank: an unset filter maps back to the "All Branches" option.
  const selectedBranchOption =
    branchOptions.find((option) => option.value === String(branchSubId ?? "")) ??
    ALL_BRANCHES_OPTION;

  const handleBranchChange = (option: SelectOption | null) => {
    const rawValue = option?.value ?? "";
    onBranchSubIdChange(rawValue === "" ? null : parseInt(rawValue, 10));
  };

  const hasActiveFilters = month !== null || year !== null || branchSubId !== null;

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="hidden sm:block">
        <span className="text-sm font-medium text-gray-700 dark:text-bodydark1">
          Filter by Loan Release Date & Branch:
        </span>
      </div>

      {/* Filters Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Month Dropdown */}
        <div className="relative">
          <select
            aria-label="Filter by release month"
            value={month ?? ""}
            onChange={(e) => {
              const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
              onMonthChange(value);
            }}
            className="w-full rounded border border-stroke bg-white dark:bg-boxdark dark:border-strokedark px-3 py-2 text-sm outline-none transition focus:border-primary active:border-primary dark:focus:border-primary"
          >
            <option value="">All Months</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year Dropdown */}
        <div className="relative">
          <select
            aria-label="Filter by release year"
            value={year ?? ""}
            onChange={(e) => {
              const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
              onYearChange(value);
            }}
            className="w-full rounded border border-stroke bg-white dark:bg-boxdark dark:border-strokedark px-3 py-2 text-sm outline-none transition focus:border-primary active:border-primary dark:focus:border-primary"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Branch Dropdown */}
        <div className="relative">
          <ReactSelect
            aria-label="Filter by branch"
            options={branchOptions}
            value={selectedBranchOption}
            onChange={handleBranchChange}
            placeholder="All Branches"
            isDisabled={loading || !!error}
            isLoading={loading}
            loadingMessage={() => "Loading..."}
            noOptionsMessage={() =>
              error ? "Error loading branches" : "No branches found"
            }
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
          />
          {error && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Clear Button */}
        {hasActiveFilters && (
          <div className="flex items-center">
            <button
              onClick={onClearFilters}
              className="w-full sm:w-auto px-4 py-2 rounded text-sm font-medium text-white bg-meta-1 hover:bg-opacity-90 transition focus:outline-none focus:ring-2 focus:ring-meta-1 focus:ring-offset-1"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateBranchFilters;
