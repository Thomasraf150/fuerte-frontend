"use client";

import React from "react";
import { TableColumn } from "react-data-table-component";
import { ProblemAccountRow } from "@/hooks/useProblemAccountsPaginated";
import { formatNumber } from "@/utils/formatNumber";
import { formatCount } from "@/utils/helper";
import StatusBadge from "@/components/StatusBadge";

const num = (raw: string) => parseFloat(raw) || 0;
const fmt = (raw: string) => formatNumber(num(raw));

export const RED = "#dc2626"; // red-600 — inline style to beat any RDT cell default colour
export const GRAY = "#9ca3af"; // gray-400 — neutral "empty" value style

/**
 * What each figure on this screen actually counts.
 *
 * Single source of truth, shared by the column header tooltips, the mobile
 * cards and the on-screen legend, so the three can never drift apart. Wording
 * is taken from the definition in the backend, not invented here:
 * `fuerte-backend/app/Repositories/Sql/ShortfallCte.php` (`per_loan` layer) —
 * a schedule counts once the NEXT schedule's due date has passed, and it is
 * UA when nothing was allocated to it, SP when something was but a residual
 * remains.
 */
export const METRIC_HELP = {
  missed:
    "Cut-offs whose payment date has already passed with money still outstanding — either nothing was collected, or less than the scheduled amount.",
  scheduled:
    "Total that should have been collected by now, across every cut-off already past.",
  collected: "Total collected against this loan to date.",
  // ua and sp do not repeat their own term: the legend, the column header and
  // the card label beside them already name it, and the amount cells prefix it.
  ua: "Cut-offs where nothing at all was collected.",
  sp: "Cut-offs that were paid, but less than the scheduled amount.",
  shortfall: "Everything still owed on this loan: Uncollected (UA) plus Shorts (SP).",
  oldest: "Due date of the earliest cut-off that is still unpaid or short.",
} as const;

/**
 * Viewport widths (px) below which a column drops out.
 *
 * These are about READABILITY. `useDatatableTheme` stops the table's wrapper
 * shrink-wrapping its content (`tableWrapper` is `display: block`), so the
 * visible columns share the container width, and the table only scrolls
 * sideways if their minimum widths (the library's 100px each) add up to more
 * than that. What these thresholds buy is column width: measured with a
 * deliberately pessimistic fixture (a 12-character peso figure in every money
 * column), ten columns share the space at ~112px each below 1600px, which is too
 * narrow for the figures — and a value too wide for its cell is CLIPPED, with no
 * "…", from the left in these right-aligned columns, so leading digits vanish.
 * Dropping to seven, and then to four, keeps every number whole instead.
 *
 * Below `md` the table is not rendered at all — ProblemAccountsCards takes over.
 *
 * Kept as `hide` (a react-data-table-component media rule) rather than more
 * page CSS, because these travel with the column they belong to. Re-measure
 * with tests/e2e/23-problem-accounts if a column is added or removed.
 */
const HIDE_BELOW_WIDE = 1599; // context columns: only on a genuinely wide screen
const HIDE_BELOW_DESKTOP = 1279; // breakdown columns: laptop and up

/**
 * A header label that is allowed to wrap onto a second line.
 *
 * react-data-table-component hard-codes `white-space: nowrap; overflow: hidden;
 * text-overflow: ellipsis` on the header label — but ONLY when `column.name` is
 * a string (see the `typeof t.name === 'string'` branch in its Column render).
 * Passing a ReactNode skips that wrapper entirely, which is what stops
 * "Missed Cut-offs" from rendering as "MISSED CU…".
 *
 * `title` gives the full explanation on hover. It is deliberately not the only
 * affordance — `title` does nothing on a touch screen, so the legend above the
 * list shows the same METRIC_HELP text for missed cut-offs, UA and SP, and the
 * mobile cards spell those terms out.
 */
const HeaderLabel: React.FC<{ help: string; right?: boolean; children: React.ReactNode }> = ({
  help,
  right,
  children,
}) => (
  <span
    title={help}
    /**
     * A mid-word break is the safety net, not the normal case. A single long
     * word ("UNCOLLECTED" is ~100px at the inherited 14px uppercase) cannot wrap
     * at a space, so in a right-aligned column narrower than the word it
     * overflowed to the LEFT and the head cell's `overflow: hidden` ate the
     * first characters — "UNCOLLECTED (UA)" rendered as "NCOLLECTED UA)". The
     * reduced header padding (8px a side, set in useDatatableTheme) means it
     * almost never comes to this, but allowing a mid-word break guarantees a
     * character is never silently lost.
     */
    className={`block whitespace-normal leading-tight${right ? " text-right" : ""}`}
    // `anywhere`, not Tailwind's `break-words` (= `break-word`): with ten
    // columns sharing 1196px each header gets ~95px of content, and
    // "UNCOLLECTED" measures ~102px at the shared 14px uppercase style.
    // `break-word` left it overhanging by 7px; `anywhere` breaks it. Inline so
    // it cannot lose to the styled-component the library injects at runtime.
    style={{ textOverflow: "clip", overflowWrap: "anywhere" }}
  >
    {children}
  </span>
);

export interface RowGroupInfo {
  isFirst: boolean;
  count: number;
}

const borrowerColumn = (
  groupByLoanId: Map<string, RowGroupInfo>
): TableColumn<ProblemAccountRow> => ({
  id: "pa-borrower",
  name: <HeaderLabel help="Borrower on the loan.">Borrower</HeaderLabel>,
  sortable: false,
  grow: 2,
  cell: (row) => {
    const info = groupByLoanId.get(row.loan_id) ?? { isFirst: true, count: 1 };
    return (
      /**
       * `min-w-0` + `truncate` is what keeps the table's width a function of
       * the column set instead of the data. Without it the flex item's
       * automatic minimum size is its longest borrower name, so one
       * "MAGSAYSAY-VILLAFUERTE, MA. CRISTINA GUERRERO-BALTAZAR" on the page
       * widened the whole table by ~100px and pushed the Shortfall column off
       * the right edge. Zeroing the minimum lets `grow: 2` hand this column the
       * spare space when there is some, and ellipsize when there is not — the
       * full name stays available via the `title` tooltip. (The row-hover
       * reveal in app/styles.css does not reach it: `truncate` sets its own
       * `white-space: nowrap`.)
       */
      <div className="flex w-full min-w-0 items-center gap-2 py-1">
        <span
          title={row.borrower_name}
          className={`min-w-0 truncate ${
            info.isFirst
              ? "text-black dark:text-white font-medium"
              : "text-body dark:text-bodydark"
          }`}
        >
          {row.borrower_name}
        </span>
        {info.isFirst && info.count > 1 && (
          <StatusBadge tone="neutral" icon={false} className="shrink-0">
            {info.count} loans
          </StatusBadge>
        )}
      </div>
    );
  },
});

const baseColumns: TableColumn<ProblemAccountRow>[] = [
  {
    id: "pa-loan-ref",
    name: <HeaderLabel help="Loan reference number.">Loan Ref</HeaderLabel>,
    sortable: false,
    // A long reference ("FBLU-00000087") still ellipsizes once ten columns are
    // on screen and each is ~112px. It is an identifier, so keep the full value
    // reachable on hover rather than widening the column and squeezing the
    // money figures.
    cell: (row) => (
      <span className="block w-full min-w-0 truncate" title={row.loan_ref}>
        {row.loan_ref}
      </span>
    ),
  },
  {
    id: "pa-branch",
    name: <HeaderLabel help="Branch / sub-branch that owns the loan.">Branch</HeaderLabel>,
    sortable: false,
    hide: HIDE_BELOW_DESKTOP,
    cell: (row) => {
      const label = [row.branch_name, row.sub_branch_name].filter(Boolean).join(" / ");
      if (!label) return "—";
      /**
       * Same `min-w-0` + `truncate` treatment as the Borrower column, and for
       * the same reason: "Nueva Vizcaya / Nueva Vizcaya Sub 2" is a real label,
       * and left unbounded it alone took the seven-column set from 929px to
       * 1072px. The full value stays on the tooltip.
       */
      return (
        <span className="block w-full min-w-0 truncate" title={label}>
          {label}
        </span>
      );
    },
  },
  {
    id: "pa-missed",
    name: <HeaderLabel help={METRIC_HELP.missed} right>Missed Cut-offs</HeaderLabel>,
    sortable: false,
    right: true,
    cell: (row) => {
      const n = row.cutoffs_missed ?? 0;
      return n > 0 ? (
        <span
          className="tabular-nums"
          style={{ color: RED, fontWeight: 700 }}
          title={`${formatCount(n)} missed — ${METRIC_HELP.missed}`}
        >
          {formatCount(n)}
        </span>
      ) : (
        <span style={{ color: GRAY }}>0</span>
      );
    },
  },
  {
    id: "pa-scheduled",
    name: <HeaderLabel help={METRIC_HELP.scheduled} right>Scheduled</HeaderLabel>,
    sortable: false,
    right: true,
    hide: HIDE_BELOW_WIDE,
    cell: (row) => <span className="tabular-nums">{fmt(row.cumulative_scheduled)}</span>,
  },
  {
    id: "pa-collected",
    name: <HeaderLabel help={METRIC_HELP.collected} right>Collected</HeaderLabel>,
    sortable: false,
    right: true,
    hide: HIDE_BELOW_WIDE,
    cell: (row) => <span className="tabular-nums">{fmt(row.cumulative_collected)}</span>,
  },
  {
    id: "pa-ua",
    name: <HeaderLabel help={METRIC_HELP.ua} right>Uncollected (UA)</HeaderLabel>,
    sortable: false,
    right: true,
    hide: HIDE_BELOW_DESKTOP,
    cell: (row) => {
      const v = num(row.ua_amount);
      return v > 0 ? (
        <span className="tabular-nums" style={{ color: RED, fontWeight: 700 }} title={`Uncollected (UA): ${METRIC_HELP.ua}`}>
          {fmt(row.ua_amount)}
        </span>
      ) : (
        <span style={{ color: GRAY }}>—</span>
      );
    },
  },
  {
    id: "pa-sp",
    name: <HeaderLabel help={METRIC_HELP.sp} right>Shorts (SP)</HeaderLabel>,
    sortable: false,
    right: true,
    hide: HIDE_BELOW_DESKTOP,
    cell: (row) => {
      const v = num(row.sp_amount);
      return v > 0 ? (
        <span className="tabular-nums" style={{ color: RED, fontWeight: 700 }} title={`Shorts (SP): ${METRIC_HELP.sp}`}>
          {fmt(row.sp_amount)}
        </span>
      ) : (
        <span style={{ color: GRAY }}>—</span>
      );
    },
  },
  {
    id: "pa-shortfall",
    name: <HeaderLabel help={METRIC_HELP.shortfall} right>Shortfall</HeaderLabel>,
    sortable: false,
    right: true,
    cell: (row) => (
      <span className="tabular-nums" style={{ color: RED, fontWeight: 800 }} title={METRIC_HELP.shortfall}>
        {fmt(row.shortfall)}
      </span>
    ),
  },
  {
    id: "pa-oldest",
    name: <HeaderLabel help={METRIC_HELP.oldest}>Oldest Unpaid</HeaderLabel>,
    sortable: false,
    hide: HIDE_BELOW_WIDE,
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
