"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "react-toastify";
import { useDebounce } from "@/hooks/useDebounce";
import useBranches from "@/hooks/useBranches";
import {
  useProblemAccountsPaginated,
  ProblemAccountRow,
} from "@/hooks/useProblemAccountsPaginated";
import CustomDatatable from "@/components/CustomDatatable";
import ProblemAccountsSummary from "./ProblemAccountsSummary";
import { problemAccountsColumns } from "./ProblemAccountsColumns";

interface Option {
  value: string;
  label: string;
}

const SORT_OPTIONS: Option[] = [
  { value: "shortfall_desc", label: "Biggest shortfall first" },
  { value: "oldest_first", label: "Oldest unpaid first" },
  { value: "name_asc", label: "Borrower name (A-Z)" },
  { value: "shortfall_asc", label: "Smallest shortfall first" },
];

const ProblemAccountsList: React.FC = () => {
  const router = useRouter();

  const { dataBranch, dataBranchSub, fetchSubDataList } = useBranches();
  const [branchId, setBranchId] = useState<string>("");
  const [branchSubId, setBranchSubId] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("shortfall_desc");
  const debouncedSearch = useDebounce(searchInput, 400);

  const {
    data,
    summary,
    loading,
    error,
    refresh,
    setFilters,
    serverSidePaginationProps,
  } = useProblemAccountsPaginated({
    sortBy: "shortfall_desc",
    graceDays: 0,
  });

  useEffect(() => {
    setFilters({
      branchId: branchId || undefined,
      branchSubId: branchSubId || undefined,
      searchTerm: debouncedSearch || undefined,
      sortBy,
      graceDays: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, branchSubId, debouncedSearch, sortBy]);

  const branchOptions: Option[] = useMemo(() => {
    if (!dataBranch || !Array.isArray(dataBranch)) return [];
    return [
      { value: "", label: "All branches" },
      ...dataBranch.map((b) => ({ value: String(b.id), label: b.name })),
    ];
  }, [dataBranch]);

  const subBranchOptions: Option[] = useMemo(() => {
    if (!dataBranchSub || !Array.isArray(dataBranchSub)) return [];
    return [
      { value: "", label: "All sub-branches" },
      ...dataBranchSub.map((bs) => ({ value: String(bs.id), label: bs.name })),
    ];
  }, [dataBranchSub]);

  const handleBranchChange = (value: string) => {
    setBranchId(value);
    setBranchSubId("");
    if (value) {
      fetchSubDataList("id_desc", Number(value));
    }
  };

  const groupByLoanId = useMemo(() => {
    // Group same-borrower rows by borrower_id (NOT name) so two distinct
    // borrowers with identical names don't collapse into one group.
    const counts = new Map<string, number>();
    data.forEach((row) => {
      counts.set(row.borrower_id, (counts.get(row.borrower_id) ?? 0) + 1);
    });

    const result = new Map<string, { isFirst: boolean; count: number }>();
    const seen = new Set<string>();
    data.forEach((row) => {
      const isFirst = !seen.has(row.borrower_id);
      seen.add(row.borrower_id);
      result.set(row.loan_id, { isFirst, count: counts.get(row.borrower_id) ?? 1 });
    });
    return result;
  }, [data]);

  const columns = useMemo(
    () => problemAccountsColumns(groupByLoanId),
    [groupByLoanId]
  );

  const handleRowClick = (row: ProblemAccountRow) => {
    const group = groupByLoanId.get(row.loan_id);
    if (group && group.count > 1 && row.borrower_id) {
      router.push(`/problem-accounts/borrower/${row.borrower_id}`);
      return;
    }
    if (!row.oldest_unpaid_schedule_id) {
      toast.info("No unpaid schedule found for this loan.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    router.push(
      `/collection-list/${row.oldest_unpaid_schedule_id}?date=${today}&ref=${encodeURIComponent(row.loan_ref)}`
    );
  };

  return (
    <div>
      <ProblemAccountsSummary
        totalAccounts={summary.total_problem_accounts}
        totalShortfall={summary.total_shortfall}
        totalUaAmount={summary.total_ua_amount}
        totalSpAmount={summary.total_sp_amount}
        loading={loading && data.length === 0}
      />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 border-b border-stroke dark:border-strokedark">
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-medium text-gray-700 dark:text-bodydark">
              Branch
            </label>
            <select
              value={branchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="border border-stroke dark:border-strokedark rounded px-3 py-2 bg-white dark:bg-form-input text-gray-900 dark:text-white text-sm"
            >
              {branchOptions.length === 0 ? (
                <option value="">All branches</option>
              ) : (
                branchOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-medium text-gray-700 dark:text-bodydark">
              Sub-Branch
            </label>
            <select
              value={branchSubId}
              onChange={(e) => setBranchSubId(e.target.value)}
              disabled={!branchId}
              className="border border-stroke dark:border-strokedark rounded px-3 py-2 bg-white dark:bg-form-input text-gray-900 dark:text-white text-sm disabled:opacity-60"
            >
              {subBranchOptions.length === 0 ? (
                <option value="">All sub-branches</option>
              ) : (
                subBranchOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-medium text-gray-700 dark:text-bodydark">
              Search
            </label>
            <input
              type="text"
              placeholder="Loan ref or borrower name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border border-stroke dark:border-strokedark rounded px-3 py-2 bg-white dark:bg-form-input text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-medium text-gray-700 dark:text-bodydark">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-stroke dark:border-strokedark rounded px-3 py-2 bg-white dark:bg-form-input text-gray-900 dark:text-white text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center justify-between">
            <span>Error loading problem accounts: {error}</span>
            <button
              onClick={refresh}
              className="ml-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        <div className="p-2 lg:p-4 overflow-x-auto">
          <CustomDatatable
            apiLoading={loading}
            columns={columns}
            data={data}
            onRowClicked={handleRowClick}
            enableCustomHeader={true}
            title={""}
            serverSidePagination={serverSidePaginationProps}
          />
        </div>
      </div>
    </div>
  );
};

export default ProblemAccountsList;
