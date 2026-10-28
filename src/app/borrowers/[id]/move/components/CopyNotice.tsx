import React from "react";
import { Copy, Info } from "react-feather";
import type { MoveSummary } from "@/hooks/useBorrowerMove";
import { formatMoneyOrBlank } from "@/utils/helper";

const SECTION_LABEL = "text-[11px] font-semibold uppercase tracking-[0.14em] text-body dark:text-bodydark";

/**
 * A buyout: the borrower is already in the old branch's books, so they are copied to the new branch
 * as a new borrower and the old record stays. Says why, what is copied, and what is still owed on
 * each open loan at the old branch: the figure to deposit there, which this screen never books.
 */
const CopyNotice: React.FC<{ summary: MoveSummary }> = ({ summary }) => {
  const from = summary.current_branch?.name ?? "the old branch";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3 rounded-xl border border-accent/60 bg-accent/10 p-4">
        <Copy aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-[#8A6312] dark:text-accent" />
        <div className="min-w-0 text-sm text-black dark:text-bodydark1">
          <p className="font-semibold">This borrower can&apos;t be moved, but can be copied as a new borrower</p>
          <p className="mt-1">
            Their loans are already in {from}&apos;s books. For a buyout, copy them to the new branch instead: their record, loans and
            payments at {from} stay as they are.
          </p>
        </div>
      </div>

      <div>
        <h3 className={SECTION_LABEL}>Still owed at {from}</h3>
        {summary.open_loans.length === 0 ? (
          <p className="mt-2 text-sm text-body dark:text-bodydark">No open loans. Nothing is owed there.</p>
        ) : (
          <ul className="mt-2 divide-y divide-stroke rounded-lg border border-stroke dark:divide-strokedark dark:border-strokedark">
            {summary.open_loans.map((loan) => (
              <li key={loan.loan_id} className="flex items-baseline justify-between gap-3 px-3 py-2.5 text-sm">
                <span className="min-w-0 break-words text-black dark:text-bodydark1">
                  {loan.loan_ref ?? `Loan ${loan.loan_id}`}
                  {loan.branch_name && <span className="text-body dark:text-bodydark"> · {loan.branch_name}</span>}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-black dark:text-white">₱{formatMoneyOrBlank(loan.balance)}</span>
              </li>
            ))}
            {summary.open_loans.length > 1 && (
              <li className="flex items-baseline justify-between gap-3 bg-whiten px-3 py-2.5 text-sm font-semibold dark:bg-boxdark-2">
                <span>Total</span>
                <span className="tabular-nums">₱{formatMoneyOrBlank(summary.open_balance)}</span>
              </li>
            )}
          </ul>
        )}
        <p className="mt-2 flex gap-2 text-xs text-body dark:text-bodydark">
          <Info aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
          <span>
            The same figure the renewal screen shows. Pay it off by a deposit at {from}, as you do today; copying books nothing. Check the
            loan&apos;s statement before you deposit.
          </span>
        </p>
      </div>

      <div>
        <h3 className={SECTION_LABEL}>What is copied</h3>
        <p className="mt-2 text-sm text-black dark:text-bodydark1">
          Their details, spouse, work, references, co-makers and attachments go to a new borrower at the new branch, so nothing is retyped.
          Loans, bank details and applications are not copied: the new branch files a new loan.
        </p>
      </div>
    </div>
  );
};

export default CopyNotice;
