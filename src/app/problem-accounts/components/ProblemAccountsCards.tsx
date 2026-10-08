"use client";

import React from "react";
import Link from "next/link";
import { SkeletonBlock } from "@/components/LoadingStates";
import { ProblemAccountRow } from "@/hooks/useProblemAccountsPaginated";
import { formatNumber } from "@/utils/formatNumber";
import { formatCount } from "@/utils/helper";
import { METRIC_HELP, RED, GRAY, RowGroupInfo } from "./ProblemAccountsColumns";

const num = (raw: string) => parseFloat(raw) || 0;
const fmt = (raw: string) => formatNumber(num(raw));

interface Props {
  rows: ProblemAccountRow[];
  groupByLoanId?: Map<string, RowGroupInfo>;
  /** Where a card leads: the page the same row opens in the table. `null` when there is none. */
  hrefFor: (row: ProblemAccountRow) => string | null;
  /** Runs for a card that has nowhere to go, so the tap says why instead of doing nothing. */
  onSelect: (row: ProblemAccountRow) => void;
  loading?: boolean;
}

/**
 * The borrower's name is the card's one control, and its `::after` is stretched
 * over the whole card (`after:absolute after:inset-0` inside the `relative`
 * card): a tap anywhere opens it, while its accessible name stays the name alone.
 * The keyboard focus ring is drawn on that overlay, so it rings the card.
 */
const STRETCHED_TARGET =
  "after:absolute after:inset-0 after:rounded-lg focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary";

/**
 * One figure in the card's three-up stat strip.
 *
 * The label is always spelled out. On the table a user can hover a header to
 * find out what "UA" means; on a phone there is no hover, so the card carries
 * the wording instead of a tooltip.
 */
const Stat: React.FC<{ label: string; help: string; value: string; muted?: boolean }> = ({
  label,
  help,
  value,
  muted,
}) => (
  <div className="min-w-0">
    {/* Reserve two lines so the three values share a baseline — "Missed
        cut-offs" wraps at 360px while "Shorts" does not, which otherwise
        dropped its number a line below its neighbours. */}
    <dt
      className="min-h-[2.5em] text-[10px] uppercase leading-tight tracking-wide text-body dark:text-bodydark"
      title={help}
    >
      {label}
    </dt>
    <dd
      className="mt-0.5 text-sm font-bold tabular-nums"
      style={{ color: muted ? GRAY : RED }}
    >
      {value}
    </dd>
  </div>
);

/**
 * Phone view of the Problem Accounts list.
 *
 * The table is ten columns wide (~1238px intrinsic) and cannot be squeezed into
 * a 360px screen without a horizontal scrollbar, so below `md` it is replaced
 * with one card per loan. The card leads with who owes and how much, because
 * that is what a collector needs first; the diagnostic breakdown sits under it.
 *
 * Each card is a link to the page its table row opens, so Ctrl/Cmd-click and a
 * long-press open it in a new tab, and the whole card is the tap target — well
 * above the 48px minimum. A card with nowhere to go (no unpaid schedule) is a
 * button that calls `onSelect` instead.
 */
const ProblemAccountsCards: React.FC<Props> = ({
  rows,
  groupByLoanId,
  hrefFor,
  onSelect,
  loading,
}) => {
  if (loading && rows.length === 0) {
    return (
      <SkeletonBlock rows={4} label="Loading problem accounts…" />
    );
  }

  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-body dark:text-bodydark">
        No problem accounts to show.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const info = groupByLoanId?.get(row.loan_id);
        const branch = [row.branch_name, row.sub_branch_name].filter(Boolean).join(" / ");
        const ua = num(row.ua_amount);
        const sp = num(row.sp_amount);
        const href = hrefFor(row);

        return (
          <li
            key={row.loan_id}
            className="relative rounded-lg border border-stroke bg-white p-4 shadow-default transition-colors hover:bg-whiter dark:border-strokedark dark:bg-boxdark dark:hover:bg-meta-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-medium text-black dark:text-white">
                  {href ? (
                    // prefetch off: a page holds 20 cards or more, and a
                    // prefetch each is far more traffic than the one tap needs.
                    <Link href={href} prefetch={false} className={STRETCHED_TARGET}>
                      {row.borrower_name}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelect(row)}
                      className={`${STRETCHED_TARGET} text-left`}
                    >
                      {row.borrower_name}
                    </button>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-body dark:text-bodydark">
                  {row.loan_ref}
                  {branch ? ` · ${branch}` : ""}
                </p>
              </div>
              {info && info.isFirst && info.count > 1 && (
                <span className="shrink-0 rounded bg-whiten px-1.5 py-0.5 text-[10px] text-body dark:bg-meta-4 dark:text-bodydark">
                  {info.count} loans
                </span>
              )}
            </div>

            <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-stroke pt-3 dark:border-strokedark">
              <span
                className="text-xs uppercase tracking-wide text-body dark:text-bodydark"
                title={METRIC_HELP.shortfall}
              >
                Still owed
              </span>
              <span
                className="whitespace-nowrap text-xl font-bold tabular-nums"
                style={{ color: RED }}
              >
                {/* The sign is drawn; the word is spoken ("216,000.00 pesos"),
                    since screen readers do not all name "₱". */}
                <span className="mr-0.5" aria-hidden="true">
                  ₱
                </span>
                {fmt(row.shortfall)}
                <span className="sr-only"> pesos</span>
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-stroke pt-3 dark:border-strokedark">
              <Stat
                label="Missed cut-offs"
                help={METRIC_HELP.missed}
                value={formatCount(row.cutoffs_missed ?? 0)}
                muted={(row.cutoffs_missed ?? 0) === 0}
              />
              <Stat
                label="Uncollected"
                help={METRIC_HELP.ua}
                value={ua > 0 ? fmt(row.ua_amount) : "—"}
                muted={ua === 0}
              />
              <Stat
                label="Shorts"
                help={METRIC_HELP.sp}
                value={sp > 0 ? fmt(row.sp_amount) : "—"}
                muted={sp === 0}
              />
            </dl>

            <p
              className="mt-3 text-xs text-body dark:text-bodydark"
              title={METRIC_HELP.oldest}
            >
              Oldest unpaid: {row.oldest_unpaid_due_date ?? "—"}
            </p>
          </li>
        );
      })}
    </ul>
  );
};

export default ProblemAccountsCards;
