"use client";

import React, { useId } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'react-feather';
import DecisionPill, { formatDecidedOn } from '@/components/DecisionPill';
import type { BorrowerDecision, LoanApplicationRecord } from '@/utils/DataTypes';
import ApplicationSummary from './ApplicationSummary';

/**
 * The borrower's latest decision, so a Call Center ping lands on a page that says the same thing:
 * "Approved Oct 5, 2026", or "Rejected Oct 5, 2026 · Kulang ang income" (a reason is optional for
 * Approved, and shown when there is one). One sentence in the text's own flow, so a long reason
 * wraps as words do, right after the date, and the date itself never breaks.
 */
const DecisionLine: React.FC<{ decision: BorrowerDecision }> = ({ decision }) => {
  const day = formatDecidedOn(decision.decided_at);
  const reason = decision.reason?.trim();
  return (
    <p className="mt-3 break-words text-sm leading-6 text-black dark:text-white">
      <DecisionPill decision={decision} size="sm" /> {day && <span className="whitespace-nowrap">{day}</span>}
      {reason && (
        <>
          {' '}
          <span className="text-body dark:text-bodydark">·</span> {reason}
        </>
      )}
    </p>
  );
};

/**
 * An application that has become a borrower is a record, not a form: there is nothing left
 * to edit (the server refuses it). The page says so, with the borrower's latest Approved or
 * Rejected when there is one, points at the borrower, and keeps the application's basics in
 * view for Print and for reference. Call Center gets no pointer (`canOpenBorrower` false): the
 * borrower's page is not its to open, and the server refuses it.
 */
const ConvertedApplication: React.FC<{ record: LoanApplicationRecord; canOpenBorrower: boolean }> = ({ record, canOpenBorrower }) => {
  const titleId = useId();
  return (
    <div className="space-y-4">
      <section aria-labelledby={titleId} className="rounded-sm border border-success/40 bg-success/10 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <span aria-hidden="true" className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-white">
              <CheckCircle size={18} />
            </span>
            <div className="min-w-0">
              <h3 id={titleId} className="text-title-xsm font-semibold text-black dark:text-white">
                Borrower created
              </h3>
              <p className="mt-0.5 text-sm text-black dark:text-white">
                This application is now a borrower and can no longer be edited.
              </p>
              {record.borrower_decision && <DecisionLine decision={record.borrower_decision} />}
            </div>
          </div>
          {record.borrower_id ? (
            canOpenBorrower && (
              <Link
                href={`/borrowers/${record.borrower_id}`}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark md:min-h-10"
              >
                Open the borrower
                <ArrowRight aria-hidden="true" size={16} className="shrink-0" />
              </Link>
            )
          ) : (
            <p className="text-sm text-body dark:text-bodydark">The borrower is not linked to this application.</p>
          )}
        </div>
      </section>
      <ApplicationSummary record={record} />
    </div>
  );
};

export default ConvertedApplication;
