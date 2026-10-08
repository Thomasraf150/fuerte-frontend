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
import ErrorAlert from "@/components/ErrorAlert";
import StatusBadge from "@/components/StatusBadge";
import CustomDatatable from "@/components/CustomDatatable";
import { Card, CardBody } from "@/components/Card";
import ReactSelect from "@/components/ReactSelect";

interface Option {
  value: string;
  label: string;
}

// "" means "no filter" — kept as its own option so the control never renders blank.
const ALL_BRANCHES_OPTION: Option = { value: "", label: "All branches" };
const ALL_SUB_BRANCHES_OPTION: Option = { value: "", label: "All sub-branches" };
// Group (FA/FB/FC/FD) uses "all" as its no-filter value — it only narrows the
// Branch list below, it is never sent to the query.
const ALL_GROUPS_OPTION: Option = { value: "all", label: "All groups" };
/**
 * Once a group is picked, "" still spans every group, so the branch no-filter
 * entry stops claiming "All branches" and asks for an explicit branch instead.
 */
const SELECT_BRANCH_OPTION: Option = { value: "", label: "Select a branch" };

/**
 * react-select shows a blank control for a null value, so map the current filter
 * string back onto its option ("" -> the "All ..." entry).
 */
const findOption = (
  options: Option[],
  value: string,
  fallback: Option
): Option | null =>
  options.find((o) => o.value === value) ?? (value === "" ? fallback : null);

const peso = (raw: string | number | null | undefined): string => {
  const n = Number(raw ?? 0);
  return Number.isFinite(n)
    ? n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
};

/**
 * Standing pill. A flagged borrower is always danger — the 2-cut-off rule already
 * means "problem na", so there is no softer tier to communicate.
 */
const StandingBadge: React.FC<{ row: RenewableBorrowerRow }> = ({ row }) => {
  if (!row.is_problem) return <StatusBadge tone="approved">Good standing</StatusBadge>;
  return (
    <StatusBadge tone="danger">
      {row.problem_cutoffs} cut-off{row.problem_cutoffs === 1 ? "" : "s"} · ₱{peso(row.problem_shortfall)}
    </StatusBadge>
  );
};

/** One renewable borrower on a phone: name, what they could renew for, and standing. */
const RenewablePhoneRow: React.FC<{ row: RenewableBorrowerRow }> = ({ row }) => {
  const branch = `${row.branch_name ?? "—"}${row.sub_branch_name ? " / " + row.sub_branch_name : ""}`;
  return (
    <div className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-2 break-normal font-semibold uppercase leading-snug text-black dark:text-white">
          {row.borrower_name}
        </p>
        <p className="shrink-0 whitespace-nowrap text-right font-semibold tabular-nums text-black dark:text-white">
          ₱{peso(row.total_pn_amount)}
        </p>
      </div>
      <p className="mt-0.5 text-sm text-body dark:text-bodydark">
        {branch} · {row.renewable_loan_count} renewable loan{Number(row.renewable_loan_count) === 1 ? "" : "s"}
      </p>
      <p className="mt-1">
        <StandingBadge row={row} />
      </p>
    </div>
  );
};

const RenewableBorrowersList: React.FC = () => {
  const router = useRouter();
  const {
    dataBranch,
    dataBranchGroup,
    dataBranchSub,
    fetchDataList,
    fetchBranchGroupList,
    fetchSubDataList,
    loadingBranches,
    loadingBranchGroups,
    loadingSubBranches,
  } = useBranches();
  const [branchGroupId, setBranchGroupId] = useState<string>("all");
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

  // The four groups are static data — fetch once.
  useEffect(() => {
    fetchBranchGroupList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupOptions: Option[] = useMemo(() => {
    if (!dataBranchGroup || !Array.isArray(dataBranchGroup)) return [ALL_GROUPS_OPTION];
    return [
      ALL_GROUPS_OPTION,
      ...dataBranchGroup.map((g) => ({ value: String(g.id), label: g.name })),
    ];
  }, [dataBranchGroup]);

  const branchNoFilterOption =
    branchGroupId === "all" ? ALL_BRANCHES_OPTION : SELECT_BRANCH_OPTION;

  const branchOptions: Option[] = useMemo(() => {
    if (!dataBranch || !Array.isArray(dataBranch)) return [];
    return [
      branchGroupId === "all" ? ALL_BRANCHES_OPTION : SELECT_BRANCH_OPTION,
      ...dataBranch.map((b) => ({ value: String(b.id), label: b.name })),
    ];
  }, [dataBranch, branchGroupId]);

  const subBranchOptions: Option[] = useMemo(() => {
    if (!dataBranchSub || !Array.isArray(dataBranchSub)) return [];
    return [
      ALL_SUB_BRANCHES_OPTION,
      ...dataBranchSub.map((bs) => ({ value: String(bs.id), label: bs.name })),
    ];
  }, [dataBranchSub]);

  /**
   * Group only narrows which branches are offered below — it never filters the
   * list itself. Picking one therefore clears the branch/sub-branch filters
   * rather than leaving a branch from another group selected.
   */
  const handleGroupChange = (value: string) => {
    setBranchGroupId(value);
    setBranchId("");
    setBranchSubId("");
    fetchDataList("name_asc", value === "all" ? undefined : Number(value));
  };

  const handleBranchChange = (value: string) => {
    setBranchId(value);
    setBranchSubId("");
    if (value) fetchSubDataList("name_asc", Number(value));
  };

  const columns: TableColumn<RenewableBorrowerRow>[] = useMemo(
    () => [
      { name: "Borrower", cell: (r) => r.borrower_name, sortable: true, grow: 2 },
      { name: "Branch", cell: (r) => `${r.branch_name ?? "—"}${r.sub_branch_name ? " / " + r.sub_branch_name : ""}` },
      {
        name: "Renewable Loans",
        cell: (r) => (
          <StatusBadge tone="neutral" icon={false}>
            {r.renewable_loan_count}
          </StatusBadge>
        ),
        center: true,
      },
      { name: "Total PN", cell: (r) => <span className="tabular-nums">₱{peso(r.total_pn_amount)}</span>, right: true },
      { name: "Latest Released", cell: (r) => (r.latest_released_date ? String(r.latest_released_date).slice(0, 10) : "—") },
      { name: "Standing", cell: (r) => <StandingBadge row={r} /> },
    ],
    []
  );

  const handleRowClick = (row: RenewableBorrowerRow) => {
    // Straight to the borrower's profile — their Loans tab holds the renew checkboxes.
    if (row.borrower_id) router.push(`/borrowers/${row.borrower_id}`);
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-xs font-medium uppercase text-body dark:text-bodydark">Renewable Borrowers</p>
          <p className="mt-1 text-2xl font-bold text-black dark:text-white">
            {loading && data.length === 0 ? "—" : summary.total_renewable_borrowers.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-xs font-medium uppercase text-body dark:text-bodydark">Problem Accounts (this page)</p>
          <p className="mt-1 text-2xl font-bold text-danger dark:text-danger">
            {loading && data.length === 0 ? "—" : summary.total_problem_on_page.toLocaleString()}
          </p>
        </div>
      </div>

      <Card>
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-3 border-b border-stroke dark:border-strokedark">
          <div className="flex flex-col">
            <label className="mb-1.5 block text-sm font-semibold text-black dark:text-white">Group</label>
            <ReactSelect
              options={groupOptions}
              value={findOption(groupOptions, branchGroupId, ALL_GROUPS_OPTION)}
              onChange={(option) => handleGroupChange(option?.value ?? "all")}
              placeholder="All groups"
              isLoading={loadingBranchGroups}
              loadingMessage={() => "Loading groups..."}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1.5 block text-sm font-semibold text-black dark:text-white">Branch</label>
            <ReactSelect
              options={branchOptions}
              value={findOption(branchOptions, branchId, branchNoFilterOption)}
              onChange={(option) => handleBranchChange(option?.value ?? "")}
              placeholder="All branches"
              isLoading={loadingBranches}
              loadingMessage={() => "Loading branches..."}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1.5 block text-sm font-semibold text-black dark:text-white">Sub-Branch</label>
            <ReactSelect
              options={subBranchOptions}
              value={findOption(subBranchOptions, branchSubId, ALL_SUB_BRANCHES_OPTION)}
              onChange={(option) => setBranchSubId(option?.value ?? "")}
              placeholder="All sub-branches"
              isLoading={loadingSubBranches}
              loadingMessage={() => "Loading sub-branches..."}
              noOptionsMessage={() => (branchId ? "No sub-branches found" : "Select a branch first")}
              isDisabled={!branchId}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1.5 block text-sm font-semibold text-black dark:text-white">Search</label>
            <input
              type="text"
              placeholder="Borrower name or loan ref"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
            />
          </div>
        </div>

        {error && (
          <CardBody className="pb-0 sm:pb-0">
            <ErrorAlert title="The renewable borrowers didn't load." detail={error} onRetry={refresh} />
          </CardBody>
        )}

        <CardBody className="overflow-x-auto">
          <CustomDatatable
            loadFailed={Boolean(error)}
            apiLoading={loading}
            columns={columns}
            data={data}
            onRowClicked={handleRowClick}
            enableCustomHeader={true}
            title={""}
            serverSidePagination={serverSidePaginationProps}
            mobileRow={(row) => <RenewablePhoneRow row={row} />}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default RenewableBorrowersList;
