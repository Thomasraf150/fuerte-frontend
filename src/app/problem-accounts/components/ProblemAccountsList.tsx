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
import Button from '@/components/Button';
import CustomDatatable from "@/components/CustomDatatable";
import { Card, CardBody } from "@/components/Card";
import ReactSelect from "@/components/ReactSelect";
import ProblemAccountsSummary from "./ProblemAccountsSummary";
import ProblemAccountsCards from "./ProblemAccountsCards";
import ProblemAccountsLegend from "./ProblemAccountsLegend";
import ProblemAccountsPager from "./ProblemAccountsPager";
import { problemAccountsColumns } from "./ProblemAccountsColumns";
import { todayLocalISO } from "@/utils/helper";

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

const SORT_OPTIONS: Option[] = [
  { value: "shortfall_desc", label: "Biggest shortfall first" },
  { value: "oldest_first", label: "Oldest unpaid first" },
  { value: "name_asc", label: "Borrower name (A-Z)" },
  { value: "shortfall_asc", label: "Smallest shortfall first" },
];

const ProblemAccountsList: React.FC = () => {
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
  });

  useEffect(() => {
    setFilters({
      branchId: branchId || undefined,
      branchSubId: branchSubId || undefined,
      searchTerm: debouncedSearch || undefined,
      sortBy,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, branchSubId, debouncedSearch, sortBy]);

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
    if (value) {
      fetchSubDataList("name_asc", Number(value));
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

  /**
   * Where a row leads — shared by the table's row click and the phone cards'
   * links, so the two cannot disagree. `null` when the loan has no unpaid
   * schedule to open.
   */
  const rowHref = (row: ProblemAccountRow): string | null => {
    const group = groupByLoanId.get(row.loan_id);
    if (group && group.count > 1 && row.borrower_id) {
      return `/problem-accounts/borrower/${row.borrower_id}`;
    }
    if (!row.oldest_unpaid_schedule_id) return null;
    const today = todayLocalISO();
    return `/collection-list/${row.oldest_unpaid_schedule_id}?date=${today}&ref=${encodeURIComponent(row.loan_ref)}`;
  };

  const handleRowClick = (row: ProblemAccountRow) => {
    const href = rowHref(row);
    if (!href) {
      toast.info("No unpaid schedule found for this loan.");
      return;
    }
    router.push(href);
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

      <Card>
        {/*
          Five filters only go side by side from 2xl. At `lg` the sidebar left
          each control ~130px, which truncated both the sub-branch value and the
          search placeholder.
        */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 border-b border-stroke dark:border-strokedark">
          <div className="flex flex-col">
            <label className="mb-1.5 block text-sm font-semibold text-black dark:text-white">
              Group
            </label>
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
            <label className="mb-1.5 block text-sm font-semibold text-black dark:text-white">
              Branch
            </label>
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
            <label className="mb-1.5 block text-sm font-semibold text-black dark:text-white">
              Sub-Branch
            </label>
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
            <label className="mb-1.5 block text-sm font-semibold text-black dark:text-white">
              Search
            </label>
            <input
              type="text"
              placeholder="Loan ref or borrower name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1.5 block text-sm font-semibold text-black dark:text-white">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ProblemAccountsLegend />

        {/*
          `bg-danger/10 border-danger text-danger` rendered as an unstyled box:
          tailwind.config.ts assigns `red` a bare string, which wipes out the
          whole default shade scale, so every `red-<shade>` utility in this app
          is dead. `danger` is the live token. Stacks on a phone so a long
          message and the Retry button do not fight for one row.
        */}
        {error && (
          <div className="m-4 flex flex-col gap-2 rounded border border-danger bg-danger/10 p-3 text-danger sm:flex-row sm:items-center sm:justify-between">
            <span>Error loading problem accounts: {error}</span>
            <Button variant="secondary" size="sm" className="shrink-0" onClick={refresh}>
              Retry
            </Button>
          </div>
        )}

        {/*
          Below `md` the ten-column table (~1238px intrinsic) is swapped for one
          card per loan. Above it, the table keeps its own responsive ladder via
          the `hide` breakpoints in ProblemAccountsColumns.
        */}
        <CardBody className="md:hidden">
          <ProblemAccountsCards
            rows={data}
            groupByLoanId={groupByLoanId}
            hrefFor={rowHref}
            onSelect={handleRowClick}
            loading={loading}
          />
          <ProblemAccountsPager
            currentPage={serverSidePaginationProps.currentPage}
            totalPages={serverSidePaginationProps.totalPages}
            totalRecords={serverSidePaginationProps.totalRecords}
            onPageChange={serverSidePaginationProps.onPageChange}
          />
        </CardBody>

        <CardBody className="hidden md:block">
          <CustomDatatable
            apiLoading={loading}
            columns={columns}
            data={data}
            onRowClicked={handleRowClick}
            enableCustomHeader={true}
            title={""}
            serverSidePagination={serverSidePaginationProps}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default ProblemAccountsList;
