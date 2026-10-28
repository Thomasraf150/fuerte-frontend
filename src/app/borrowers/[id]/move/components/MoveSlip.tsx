import React from "react";
import { ArrowDown, ArrowRight } from "react-feather";
import type { MoveBranch } from "@/hooks/useBorrowerMove";

interface MoveSlipProps {
  from: MoveBranch | null;
  /** The branch chosen below; null until one is. */
  to: MoveBranch | null;
  /** The move is refused: the "to" end says so instead of asking for a branch. */
  blocked?: boolean;
  /** A buyout copy: the "to" end is a new borrower there. */
  copying?: boolean;
}

/** "FB", "FC": the funding company, the one thing that changes who books the release. */
const GroupChip: React.FC<{ group: string | null }> = ({ group }) =>
  group ? (
    <span className="mt-2 inline-flex rounded-full border border-current px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em]">
      {group}
    </span>
  ) : null;

/**
 * The transfer slip: where the borrower is now, a route, and where they are going. Reads like the
 * paper slips branches already pass around. The "to" end stays a dashed blank until a branch is
 * chosen, then fills in olive. On phones the route runs top to bottom, from sm left to right.
 */
const MoveSlip: React.FC<MoveSlipProps> = ({ from, to, blocked = false, copying = false }) => (
  <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3" aria-live="polite">
    <div className="flex-1 rounded-xl border border-stroke bg-whiten px-4 py-3 text-body dark:border-strokedark dark:bg-boxdark-2 dark:text-bodydark">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">Now at</p>
      <p className="mt-1 break-words font-display text-xl font-semibold text-black dark:text-white">{from?.name ?? "No branch"}</p>
      <GroupChip group={from?.group_name ?? null} />
    </div>

    {/* The route: a dashed line through a gold stop. Decorative; the words carry the meaning. */}
    <div className="flex flex-col items-center justify-center sm:flex-row" aria-hidden="true">
      <span className="h-3 w-px border-l border-dashed border-field sm:h-px sm:w-4 sm:border-l-0 sm:border-t" />
      <span className="mx-1 my-1 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-ink shadow-1">
        <ArrowDown size={18} className="sm:hidden" />
        <ArrowRight size={18} className="hidden sm:block" />
      </span>
      <span className="h-3 w-px border-l border-dashed border-field sm:h-px sm:w-4 sm:border-l-0 sm:border-t" />
    </div>

    <div
      className={`flex-1 rounded-xl border px-4 py-3 transition-colors duration-300 motion-reduce:transition-none ${
        to
          ? "border-primary bg-olive-50 text-primary dark:border-olive-300 dark:bg-olive-950 dark:text-olive-300"
          : "border-dashed border-field bg-white text-body dark:bg-boxdark dark:text-bodydark"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{copying ? "Copying to, as a new borrower" : "Moving to"}</p>
      <p className={`mt-1 break-words font-display text-xl font-semibold ${to ? "text-black dark:text-white" : "italic opacity-70"}`}>
        {to?.name ?? (blocked ? "Not for now" : "Choose a branch below")}
      </p>
      <GroupChip group={to?.group_name ?? null} />
    </div>
  </div>
);

export default MoveSlip;
