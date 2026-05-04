"use client";

import { TableColumn } from "react-data-table-component";
import { ProblemAccountRow } from "@/hooks/useProblemAccountsPaginated";
import { formatNumber } from "@/utils/formatNumber";

const num = (raw: string) => parseFloat(raw) || 0;
const fmt = (raw: string) => formatNumber(num(raw));
const RED = "#dc2626"; // red-600 — inline style to beat any RDT cell default colour

export interface RowGroupInfo {
  isFirst: boolean;
  count: number;
}

const borrowerColumn = (
  groupByLoanId: Map<string, RowGroupInfo>
): TableColumn<ProblemAccountRow> => ({
  name: "Borrower",
  sortable: false,
  grow: 2,
  cell: (row) => {
    const info = groupByLoanId.get(row.loan_id) ?? { isFirst: true, count: 1 };
    return (
      <div className="flex items-center gap-2 py-1">
        <span
          className={
            info.isFirst
              ? "text-black dark:text-white font-medium"
              : "text-gray-400 dark:text-gray-500"
          }
        >
          {row.borrower_name}
        </span>
        {info.isFirst && info.count > 1 && (
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            {info.count} loans
          </span>
        )}
      </div>
    );
  },
});

const baseColumns: TableColumn<ProblemAccountRow>[] = [
  {
    name: "Loan Ref",
    sortable: false,
    cell: (row) => row.loan_ref,
  },
  {
    name: "Branch",
    sortable: false,
    cell: (row) => {
      const label = [row.branch_name, row.sub_branch_name].filter(Boolean).join(" / ");
      return label || "—";
    },
  },
  {
    name: "Days Past Due",
    sortable: false,
    right: true,
    cell: (row) => row.days_past_due,
  },
  {
    name: "Scheduled",
    sortable: false,
    right: true,
    cell: (row) => fmt(row.cumulative_scheduled),
  },
  {
    name: "Collected",
    sortable: false,
    right: true,
    cell: (row) => fmt(row.cumulative_collected),
  },
  {
    name: "Uncollected (UA)",
    sortable: false,
    right: true,
    cell: (row) => {
      const v = num(row.ua_amount);
      return v > 0 ? (
        <span style={{ color: RED, fontWeight: 700 }}>{fmt(row.ua_amount)}</span>
      ) : (
        <span style={{ color: "#9ca3af" }}>—</span>
      );
    },
  },
  {
    name: "Shorts (SP)",
    sortable: false,
    right: true,
    cell: (row) => {
      const v = num(row.sp_amount);
      return v > 0 ? (
        <span style={{ color: RED, fontWeight: 700 }}>{fmt(row.sp_amount)}</span>
      ) : (
        <span style={{ color: "#9ca3af" }}>—</span>
      );
    },
  },
  {
    name: "Shortfall",
    sortable: false,
    right: true,
    cell: (row) => (
      <span style={{ color: RED, fontWeight: 800 }}>{fmt(row.shortfall)}</span>
    ),
  },
  {
    name: "Oldest Unpaid",
    sortable: false,
    cell: (row) => row.oldest_unpaid_due_date ?? "—",
  },
];

/**
 * Full column set for the main Problem Accounts list — Borrower column first,
 * then the per-loan financial columns.
 */
export const problemAccountsColumns = (
  groupByLoanId: Map<string, RowGroupInfo>
): TableColumn<ProblemAccountRow>[] => [borrowerColumn(groupByLoanId), ...baseColumns];

/**
 * Same columns minus the Borrower column. Used on the borrower drill-down
 * page where every row is the same person — Borrower would be redundant.
 */
export const problemAccountsColumnsCompact = (): TableColumn<ProblemAccountRow>[] =>
  baseColumns;
