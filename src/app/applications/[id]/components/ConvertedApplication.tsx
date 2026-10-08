"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Clock, Slash } from 'react-feather';
import { formatDecidedOn } from '@/components/DecisionPill';
import type { BorrowerDecision, LoanApplicationRecord } from '@/utils/DataTypes';
import ApplicationSummary from './ApplicationSummary';

/*
 * An application that has become a borrower is a record, not a form. Since 2026-10-08 the page
 * leads with the borrower's OUTCOME, decided by Marketing, and treats "Borrower created" as plain
 * history (Rafael: a green "Borrower created" card holding a red "Rejected" stamp was confusing).
 * Research (scratchpad decision-banner-research, Part 2): the latest outcome sets the one tone of
 * the record; a finished earlier step carries no colour; a rejection is a business decision, not an
 * error, so a red edge and icon, never a red fill; the full reason in quotes; say what it means for
 * the reader and who can change it, in short plain sentences.
 */

/** "Rejected by Marketing" when the server names the team; else the bare word. */
const decidedBy = (status: BorrowerDecision['status'], outcomeLabel: string | null | undefined): string => {
  const word = status === 'rejected' ? 'Rejected' : 'Approved';
  const label = outcomeLabel?.trim() ?? '';
  return label.toLowerCase().startsWith(`${word.toLowerCase()} by `) ? label : word;
};

type OutcomeKind = 'rejected' | 'approved' | 'waiting' | 'deleted';

// Each edge restated under dark: the card's dark:border-strokedark would otherwise repaint the left edge too.
const OUTCOME_EDGE: Record<OutcomeKind, string> = {
  rejected: 'border-l-danger dark:border-l-danger',
  approved: 'border-l-success dark:border-l-success',
  waiting: 'border-l-stroke dark:border-l-strokedark',
  deleted: 'border-l-stroke dark:border-l-strokedark',
};

const NEXT_STEP: Record<OutcomeKind, string> = {
  rejected: 'To give a loan, approve this borrower first.',
  approved: 'The branch can now give this borrower a loan.',
  waiting: 'Marketing will approve or reject this borrower.',
  deleted: 'The borrower made from this application was deleted.',
};

const OutcomeCard: React.FC<{ record: LoanApplicationRecord; canOpenBorrower: boolean }> = ({ record, canOpenBorrower }) => {
  const decision = record.borrower_decision;
  // A deleted borrower outranks its last decision: nobody can lend to it either way.
  const kind: OutcomeKind = record.outcome === 'borrower_deleted' ? 'deleted' : decision?.status ?? 'waiting';
  const by = decision ? decidedBy(decision.status, record.outcome_label) : '';
  const day = decision ? formatDecidedOn(decision.decided_at) : '';
  const reason = decision?.reason?.trim();

  const icon =
    kind === 'rejected' ? <Slash aria-hidden="true" size={20} strokeWidth={2.5} className="mt-0.5 shrink-0 text-danger" />
    : kind === 'approved' ? <CheckCircle aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-success" />
    : kind === 'deleted' ? <Slash aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-body dark:text-bodydark" />
    : <Clock aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-body dark:text-bodydark" />;

  const heading =
    kind === 'rejected' ? `${by}: no new loans for this borrower`
    : kind === 'approved' ? `${by}`
    : kind === 'deleted' ? 'Borrower deleted'
    : "Waiting for Marketing's decision";

  return (
    // The region is the converted record, so it keeps its name ("Borrower created"); the outcome is its heading.
    <section
      aria-label="Borrower created"
      data-testid="converted-outcome"
      data-outcome={kind}
      className={`flex flex-col gap-4 rounded-2xl border border-stroke border-l-4 bg-white px-5 py-4 shadow-default sm:flex-row sm:items-start sm:justify-between dark:border-strokedark dark:bg-boxdark ${OUTCOME_EDGE[kind]}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon}
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-base font-semibold text-black dark:text-white">{heading}</h3>
          {kind !== 'deleted' && reason && (
            <p className="break-words text-[15px] leading-6 text-black dark:text-white">
              <span className="font-semibold">Why: </span>&ldquo;{reason}&rdquo;
            </p>
          )}
          {kind !== 'deleted' && day && <p className="text-sm text-body dark:text-bodydark">{decision?.status === 'rejected' ? 'Rejected' : 'Approved'} on <span className="whitespace-nowrap">{day}</span>.</p>}
          <p className="text-sm text-body dark:text-bodydark">
            {/* Any branch user but Call Center may decide (BorrowerDecisionService), so Call Center is told the branch, not "only Marketing". */}
            {kind === 'rejected' && !canOpenBorrower
              ? "The branch can approve this borrower later. You don't need to do anything."
              : NEXT_STEP[kind]}
          </p>
          {/* History, in plain ink: the earlier step carries no colour. */}
          <p className="pt-1 text-sm text-body dark:text-bodydark">This application is now a borrower and can no longer be edited.</p>
        </div>
      </div>
      {kind === 'deleted' ? null : record.borrower_id ? (
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
    </section>
  );
};

/**
 * An application that has become a borrower: its outcome first, then the application's basics for
 * Print and for reference. Call Center gets no pointer (`canOpenBorrower` false): the borrower's
 * page is not its to open, and the server refuses it.
 */
const ConvertedApplication: React.FC<{ record: LoanApplicationRecord; canOpenBorrower: boolean }> = ({ record, canOpenBorrower }) => (
  <div className="space-y-4">
    <OutcomeCard record={record} canOpenBorrower={canOpenBorrower} />
    <ApplicationSummary record={record} />
  </div>
);

export default ConvertedApplication;
