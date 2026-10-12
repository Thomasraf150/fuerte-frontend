"use client";

import React from 'react';
import Link from 'next/link';
import { CheckCircle, ChevronRight } from 'react-feather';
import { Card } from '@/components/Card';
import useMyWorklist, { WorklistCount, WorklistStep } from '@/hooks/useMyWorklist';
import { useDeletionRequestsStore } from '@/store/deletionRequestsStore';
import { formatMoneyOrBlank } from '@/utils/helper';
import { waitedFor } from '@/utils/reportPeriod';
import { listHref } from '@/utils/applicationOutcome';

/** The loan page's own step names (the numbered tabs), so the row says what the tab says. */
const STEP_LABEL: Record<WorklistStep, string> = {
  schedule: 'Set Effectivity / Maturity',
  pn: 'PN Signing',
  bank: 'Bank Details',
  release: 'Approve and Release',
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Gold left edge = "a person must act"; the whole row is the link (48px on phones, 40px from lg).
const ROW =
  'group flex min-h-12 items-center gap-3 border-l-4 border-secondary bg-white px-4 py-2.5 text-black transition-colors hover:bg-whiten focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:bg-boxdark dark:text-white dark:hover:bg-meta-4 lg:min-h-10';
const META = 'text-sm text-body dark:text-bodydark';

interface CountRowProps {
  href: string;
  label: string;
  item: WorklistCount | null;
}

/** One kind of work as a single line: "Create borrowers for 2 interviewed applicants · oldest 3 days". */
const CountRow: React.FC<CountRowProps> = ({ href, label, item }) =>
  item && item.count > 0 ? (
    <li>
      <Link href={href} className={ROW}>
        <span className="min-w-0 flex-1 font-semibold">{label}</span>
        {item.oldest_at && <span className={`${META} shrink-0`}>oldest {waitedFor(item.oldest_at)}</span>}
        <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-body group-hover:text-primary" />
      </Link>
    </li>
  ) : null;

/**
 * "Waiting on you" (2026-10-12, after CHR's "Needs a decision"): what the signed-in user can act
 * on now, computed for them by the server (myWorklist) plus the deletion requests the bell
 * already counts. Rows appear only when there is something to do; with nothing, one quiet line.
 * Research: NN/g (operational dashboards, indicators vs notifications), Xero home tasks, Carbon
 * empty states; see the 2026-10-12 notes in claude-docs.
 */
const Worklist: React.FC = () => {
  const { data, failed, loading, retry } = useMyWorklist();
  const deletions = useDeletionRequestsStore((s) => s.pendingCount);

  const counts = [data?.interviewed, data?.approved_no_loan, data?.undecided_borrowers];
  const total = (data?.loans_total ?? 0) + deletions + counts.reduce((sum, c) => sum + (c?.count ?? 0), 0);

  return (
    <Card className="mb-4 overflow-hidden" aria-labelledby="worklist-title">
      <div className="flex items-center justify-between gap-3 border-b border-stroke px-4 py-3 dark:border-strokedark">
        <h3 id="worklist-title" className="font-display text-lg font-semibold text-black dark:text-white">Waiting on you</h3>
        {total > 0 && (
          <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-secondary px-2 py-0.5 text-sm font-bold text-black">
            {total}
            <span className="sr-only"> {total === 1 ? 'thing' : 'things'} to do</span>
          </span>
        )}
      </div>

      {loading ? (
        <div role="status" className="space-y-2 p-4">
          <span className="sr-only">Loading your to-do list…</span>
          <div aria-hidden="true" className="h-5 w-2/3 animate-pulse rounded bg-stroke motion-reduce:animate-none dark:bg-meta-4" />
          <div aria-hidden="true" className="h-5 w-1/2 animate-pulse rounded bg-stroke motion-reduce:animate-none dark:bg-meta-4" />
        </div>
      ) : total === 0 && !failed ? (
        <p className={`${META} flex items-center gap-2 px-4 py-3`}>
          <CheckCircle aria-hidden="true" size={18} className="text-primary dark:text-olive-300" />
          Nothing is waiting on you.
        </p>
      ) : (
        <ul className="divide-y divide-stroke dark:divide-strokedark">
          {deletions > 0 && (
            <li>
              <Link href="/approvals" className={ROW}>
                <span className="min-w-0 flex-1 font-semibold">
                  Decide on {plural(deletions, 'deletion request', 'deletion requests')}
                </span>
                <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-body group-hover:text-primary" />
              </Link>
            </li>
          )}

          {data && data.loans_total > 0 && (
            <li>
              <p className="px-4 pb-1 pt-3 text-sm font-semibold text-black dark:text-white">
                Finish {plural(data.loans_total, 'loan', 'loans')}
              </p>
              <ul>
                {data.loans.map((loan) => (
                  <li key={loan.id}>
                    <Link href={`/loans-list/${loan.id}`} className={ROW}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{loan.borrower_name}</span>
                        <span className={`${META} block`}>
                          Next: {STEP_LABEL[loan.step]}
                          {loan.pn_amount ? ` · ₱${formatMoneyOrBlank(loan.pn_amount)}` : ''}
                        </span>
                      </span>
                      <span className={`${META} shrink-0`}>{waitedFor(loan.updated_at)}</span>
                      <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-body group-hover:text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
              {data.loans_total > data.loans.length && (
                // No list shows exactly these loans, so say what is shown rather than link to one that does not.
                <p className={`${META} px-4 py-2`}>Showing the {data.loans.length} waiting longest.</p>
              )}
            </li>
          )}

          <CountRow
            href={listHref({ status: 'interviewed' })}
            label={`Create borrowers for ${plural(data?.interviewed?.count ?? 0, 'interviewed applicant', 'interviewed applicants')}`}
            item={data?.interviewed ?? null}
          />
          <CountRow
            href={listHref({ outcome: 'approved' })}
            label={`Start a loan for ${plural(data?.approved_no_loan?.count ?? 0, 'approved borrower', 'approved borrowers')}`}
            item={data?.approved_no_loan ?? null}
          />
          <CountRow
            href={listHref({ outcome: 'borrower' })}
            label={`Approve or reject ${plural(data?.undecided_borrowers?.count ?? 0, 'new borrower', 'new borrowers')}`}
            item={data?.undecided_borrowers ?? null}
          />

          {/* A failed load is said even when the deletion row (from the bell's own query) is showing. */}
          {failed && (
            <li className={`${META} flex flex-wrap items-center gap-2 px-4 py-3`}>
              Could not load the rest of your to-do list.
              <button type="button" onClick={retry} className="min-h-12 font-semibold text-primary underline-offset-2 hover:underline lg:min-h-10">
                Try again
              </button>
            </li>
          )}
        </ul>
      )}
    </Card>
  );
};

export default Worklist;
