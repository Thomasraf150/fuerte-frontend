"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { AlertTriangle, Check, ChevronLeft, Shield } from "react-feather";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Card } from "@/components/Card";
import ErrorAlert from "@/components/ErrorAlert";
import LoadingSpinner from "@/components/LoadingStates/LoadingSpinner";
import useBorrowerMove, { type MoveBranch, type MoveInput, type MoveSummary } from "@/hooks/useBorrowerMove";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { toast } from "@/utils/notify";
import MoveSlip from "./components/MoveSlip";
import MoveForm from "./components/MoveForm";
import MoveHistory from "./components/MoveHistory";
import CopyNotice from "./components/CopyNotice";

const SECTION_LABEL = "text-[11px] font-semibold uppercase tracking-[0.14em] text-body dark:text-bodydark";

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

/** What goes with the borrower, in the team's words: nothing is retyped, nothing booked moves. */
const WhatMoves: React.FC<{ summary: MoveSummary }> = ({ summary }) => {
  const items = [
    "Their details, co-makers, references, attachments and bank details. Nothing is retyped.",
    summary.loans_to_move > 0
      ? `${plural(summary.loans_to_move, "loan", "loans")} not yet released. At release it gets its loan number and accounts from the new branch.`
      : "No loans yet. Their first loan is made at the new branch.",
    `${plural(summary.applications_to_move, "application", "applications")}, so the new branch's team sees them.`,
  ];

  return (
    <div>
      <h3 className={SECTION_LABEL}>What moves with them</h3>
      <ul className="mt-3 flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm text-black dark:text-bodydark1">
            <Check aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-primary dark:text-olive-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex gap-2.5 rounded-lg bg-whiten px-3 py-2.5 text-sm text-black dark:bg-boxdark-2 dark:text-bodydark1">
        <Shield aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-[#8A6312] dark:text-accent" />
        <span>No money moves: nothing is in the old branch&apos;s books yet. (A borrower with a released loan is copied instead, for a buyout.)</span>
      </p>
    </div>
  );
};

/** Why this borrower cannot move now, and the way back. Shown instead of the form. */
const Refusal: React.FC<{ message: string; backHref: string }> = ({ message, backHref }) => (
  <div role="status" className="flex flex-col gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4 sm:flex-row sm:items-start">
    <AlertTriangle aria-hidden="true" size={20} className="shrink-0 text-[#8A6312]" />
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-black dark:text-white">This borrower can&apos;t be moved right now</p>
      <p className="mt-1 text-sm text-black dark:text-bodydark1">{message}</p>
      <Link href={backHref} className="mt-3 inline-flex min-h-12 items-center font-semibold text-primary underline-offset-4 hover:underline lg:min-h-10 dark:text-olive-300">
        Back to the borrower
      </Link>
    </div>
  </div>
);

/**
 * Move to another branch (/borrowers/[id]/move): a borrower encoded under FB moves to the FC, FD
 * or FA branch that will fund the release, with nothing retyped. A borrower already in FB's books
 * (a buyout) is copied there as a new borrower instead (summary.mode). Its own URL (a form), opened
 * from the borrower page's More menu. The server decides everything (who, which branches, move or
 * copy); this screen says it in plain words.
 */
const MoveBorrowerPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const borrowerId = Number(params.id);
  const backHref = `/borrowers/${params.id}`;
  const { summary, loading, loadError, reload, fetchAreas, move, copy } = useBorrowerMove(borrowerId);
  const [target, setTarget] = useState<MoveBranch | null>(null);
  useDocumentTitle("Move borrower", summary?.borrower_name);

  const handleMove = async (input: MoveInput): Promise<string | null> => {
    const refusal = await move(input);
    if (refusal === null) {
      toast.success(`Moved to ${target?.name ?? "the new branch"}.`);
      router.push(backHref);
    }
    return refusal;
  };

  // A buyout: the new borrower opens, at the new branch, ready for its first loan there.
  const handleCopy = async (input: MoveInput): Promise<string | null> => {
    const result = await copy(input);
    if ("refusal" in result) return result.refusal;
    toast.success(`Copied to ${target?.name ?? "the new branch"} as a new borrower.`);
    router.push(`/borrowers/${result.borrowerId}`);
    return null;
  };

  return (
    <DefaultLayout>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-4">
        <header>
          <Link href={backHref} className="inline-flex min-h-12 items-center gap-1 text-sm font-medium text-body hover:text-primary lg:min-h-10 dark:text-bodydark">
            <ChevronLeft aria-hidden="true" size={18} /> Back to the borrower
          </Link>
          <h2 className="font-display text-title-sm font-semibold text-black dark:text-white md:text-title-md2">Move to another branch</h2>
          {summary && <p className="mt-1 break-words text-base text-body dark:text-bodydark">{summary.borrower_name}</p>}
        </header>

        {loading && !summary && (
          <div className="flex min-h-[240px] items-center justify-center"><LoadingSpinner /></div>
        )}
        {loadError && !summary && <ErrorAlert title="The move screen didn't load." detail={loadError} onRetry={reload} />}

        {summary && (
          <>
            <Card className="flex flex-col gap-6 p-4 sm:p-6">
              <MoveSlip from={summary.current_branch} to={summary.mode === "none" ? null : target} blocked={summary.mode === "none"} copying={summary.mode === "copy"} />
              {summary.mode === "none" ? (
                <Refusal message={summary.refusal ?? ""} backHref={backHref} />
              ) : (
                <>
                  {summary.mode === "copy" ? <CopyNotice summary={summary} /> : <WhatMoves summary={summary} />}
                  {/* The tear line of the slip: above it what happens, below it what to fill in. */}
                  <div className="border-t border-dashed border-field" aria-hidden="true" />
                  <MoveForm
                    destinations={summary.destinations}
                    fetchAreas={fetchAreas}
                    onSubmit={summary.mode === "copy" ? handleCopy : handleMove}
                    verb={summary.mode === "copy" ? "Copy" : "Move"}
                    onTargetChange={setTarget}
                    cancelHref={backHref}
                  />
                </>
              )}
            </Card>

            <Card className="p-4 sm:p-6">
              <h3 className={SECTION_LABEL}>Past moves</h3>
              <div className="mt-3"><MoveHistory lines={summary.history} /></div>
            </Card>
          </>
        )}
      </div>
    </DefaultLayout>
  );
};

export default MoveBorrowerPage;
