"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { TableColumn } from "react-data-table-component";
import { useDebounce } from "@/hooks/useDebounce";
import useBranches from "@/hooks/useBranches";
import {
  useRenewableBorrowersPaginated,
  RenewableBorrowerRow,
} from "@/hooks/useRenewableBorrowersPaginated";
import CustomDatatable from "@/components/CustomDatatable";

interface Option {
  value: string;
  label: string;
}

const peso = (raw: string | number | null | undefined): string => {
  const n = Number(raw ?? 0);
  return Number.isFinite(n)
    ? n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
};

/**
 * Standing pill. A flagged borrower is always RED — the 2-cut-off rule already
 * means "problem na", so there is no softer tier to communicate.
 */
const StandingBadge: React.FC<{ row: RenewableBorrowerRow }> = ({ row }) => {
  if (!row.is_problem) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
        ✓ Good standing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
      ⚠ {row.problem_cutoffs} cut-off{row.problem_cutoffs === 1 ? "" : "s"} · ₱{peso(row.problem_shortfall)}
    </span>
  );
};

const RenewableBorrowersList: React.FC = () => {
  const router = useRouter();
  const { dataBranch, dataBranchSub, fetchSubDataList } = useBranches();
  const [branchId, setBranchId] = useState<string>("");
  const [branchSubId, setBranchSubId] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const {
    data,
    summary,
    loading,
    error,
    refresh,
    setFilters,
    serverSidePaginationProps,
  } = useRenewableBorrowersPaginated({});

  useEffect(() => {
    setFilters({
      branchId: branchId || undefined,
      branchSubId: branchSubId || undefined,
      searchTerm: debouncedSearch || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, branchSubId, debouncedSearch]);

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
    if (value) fetchSubDataList("id_desc", Number(value));
  };

  const columns: TableColumn<RenewableBorrowerRow>[] = useMemo(
    () => [
      { name: "Borrower", cell: (r) => r.borrower_name, sortable: true, grow: 2, minWidth: "220px" },
      { name: "Branch", cell: (r) => `${r.branch_name ?? "—"}${r.sub_branch_name ? " / " + r.sub_branch_name : ""}`, minWidth: "170px" },
      {
        name: "Renewable Loans",
        cell: (r) => (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            {r.renewable_loan_count}
          </span>
        ),
        center: true,
        minWidth: "130px",
      },
      { name: "Total PN", cell: (r) => `₱${peso(r.total_pn_amount)}`, right: true, minWidth: "130px" },
      { name: "Latest Released", cell: (r) => (r.latest_released_date ? String(r.latest_released_date).slice(0, 10) : "—"), minWidth: "130px" },
      { name: "Standing", cell: (r) => <StandingBadge row={r} />, minWidth: "220px" },
    ],
    []
  );

  const handleRowClick = (row: RenewableBorrowerRow) => {
    // Straight to the borrower's profile — their Loans tab holds the renew checkboxes.
    if (row.borrower_id) router.push(`/borrowers/${row.borrower_id}`);
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-xs font-medium uppercase text-gray-500 dark:text-bodydark">Renewable Borrowers</p>
          <p className="mt-1 text-2xl font-bold text-black dark:text-white">
            {loading && data.length === 0 ? "—" : summary.total_renewable_borrowers.toLocaleString()}
          </p>
        </div>
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-xs font-medium uppercase text-gray-500 dark:text-bodydark">Problem Accounts (this page)</p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
            {loading && data.length === 0 ? "—" : summary.total_problem_on_page.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-stroke dark:border-strokedark">
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-medium text-gray-700 dark:text-bodydark">Branch</label>
            <select
              value={branchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="border border-stroke dark:border-strokedark rounded px-3 py-2 bg-white dark:bg-form-input text-gray-900 dark:text-white text-sm"
            >
              {branchOptions.length === 0 ? (
                <option value="">All branches</option>
              ) : (
                branchOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))
              )}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-medium text-gray-700 dark:text-bodydark">Sub-Branch</label>
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
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))
              )}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-medium text-gray-700 dark:text-bodydark">Search</label>
            <input
              type="text"
              placeholder="Borrower name or loan ref"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border border-stroke dark:border-strokedark rounded px-3 py-2 bg-white dark:bg-form-input text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center justify-between">
            <span>Error loading renewable borrowers: {error}</span>
            <button onClick={refresh} className="ml-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
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

export default RenewableBorrowersList;
