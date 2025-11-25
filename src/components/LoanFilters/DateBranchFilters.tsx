"use client";

import React, { useEffect, useState } from "react";
import BranchQueryMutations from "@/graphql/BranchQueryMutation";
import { useAuthStore } from "@/store";

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
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

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
          <select
            value={branchSubId ?? ""}
            onChange={(e) => {
              const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
              onBranchSubIdChange(value);
            }}
            disabled={loading || !!error}
            className="w-full rounded border border-stroke bg-white dark:bg-boxdark dark:border-strokedark px-3 py-2 text-sm outline-none transition focus:border-primary active:border-primary dark:focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{loading ? "Loading..." : error ? "Error loading branches" : "All Branches"}</option>
            {!loading && !error && branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
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
