"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, PauseCircle } from 'react-feather';
import type { PendingRelease, Standing } from '@/graphql/CollectionReportsQueries';
import { amt } from '@/app/atm-collections/lib';

/**
 * What the Release Status screen and an employer's page share (claude-docs/collections-reports.md):
 * the standing pill, paging, and a waiting loan's row, whose verdict ends in the one action that
 * moves it on (release it, post the overdue payment, look at the employer or the branch).
 */

const STANDING: Record<Standing, { word: string; meaning: string; cls: string }> = {
  green: { word: 'Green', meaning: 'paying on time', cls: 'bg-success/10 text-success' },
  red: { word: 'Red', meaning: 'overdue', cls: 'bg-danger/10 text-danger' },
  new: { word: 'New', meaning: 'no loan history', cls: 'bg-[#2c6e86]/10 text-[#2c6e86]' },
  none: { word: 'No dues', meaning: 'nothing fell due', cls: 'bg-gray-2 text-body dark:bg-meta-4' },
};

/** The app's status pill, by standing: icon (for Red and Green), word, and what it means. */
export const StandingPill: React.FC<{ status: Standing; companyMeaning?: string }> = ({ status, companyMeaning }) => {
  const s = STANDING[status];
  const Icon = status === 'green' ? CheckCircle : status === 'red' ? PauseCircle : null;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {Icon && <Icon size={14} aria-hidden="true" strokeWidth={2.4} />}
      {s.word}{' '}<span className="font-normal opacity-80">· {companyMeaning ?? s.meaning}</span>
    </span>
  );
};

/** An employer's pill: what its Red or Green means for releases. */
export const employerMeaning = (status: Standing) => status === 'red' ? 'only on-time payers released' : status === 'green' ? 'releases allowed' : undefined;

export const PAGE_SIZES = [25, 50, 100];

/**
 * One page of rows, with the shared pager's props. The rows are all here already: paging is for
 * reading. The pager sits under the table, so a new page brings the section's top back into view.
 */
export function usePage<T>(rows: T[], noun: [string, string], sectionId: string) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(PAGE_SIZES[0]);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pages);
  const show = (next: number) => {
    setPage(next);
    document.getElementById(sectionId)?.scrollIntoView({ block: 'start' });
  };
  return {
    slice: rows.slice((current - 1) * size, current * size),
    reset: () => setPage(1),
    pager: {
      totalRecords: rows.length, currentPage: current, pageSize: size, totalPages: pages,
      hasNextPage: current < pages, hasPreviousPage: current > 1,
      onPageChange: show, onPageSizeChange: (n: number) => { setSize(n); show(1); },
      pageSizeOptions: PAGE_SIZES, recordType: noun[0], recordTypePlural: noun[1],
    },
  };
}

/** A count in a summary line: coloured only when there is something to count. */
export const Count: React.FC<{ n: number; label: string; tone: 'text-success' | 'text-danger' }> = ({ n, label, tone }) => (
  <strong className={n > 0 ? tone : 'font-semibold text-body'}>{n} {label}</strong>
);

export const employerHref = (companyId: string) => `/release-status/employers/${companyId}`;
const LINK = 'font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm';

/** The held loan's reason in a few words; the release's own sentence stays one click away. */
function shortReason(p: PendingRelease): string {
  switch (p.hold) {
    case 'borrower': return 'Borrower overdue';
    case 'employer': return `${p.company_name ?? 'Employer'} in the red`;
    case 'branch': return `${p.branch_sub_name} is in the red`;
    case 'eligibility': return 'Not cleared to borrow';
    default: return 'Held';
  }
}

/**
 * The one thing that moves this loan on: release it (the loan page opens on its Release step), post
 * the overdue payment, see the employer who is in the red, the branch's collection status, or the
 * borrower whose own record stops the loan.
 */
function nextAction(p: PendingRelease): { href: string; label: string } {
  if (p.may_release) return { href: `/loans-list/${p.loan_id}`, label: 'Release' };
  switch (p.hold) {
    case 'borrower': return p.overdue_loan_id ? { href: `/payment-posting/${p.overdue_loan_id}`, label: 'Post payment' } : { href: `/borrowers/${p.borrower_id}`, label: 'Open borrower' };
    case 'employer': return p.company_id ? { href: employerHref(p.company_id), label: `See ${p.company_name ?? 'employer'}` } : { href: `/borrowers/${p.borrower_id}`, label: 'Open borrower' };
    case 'branch': return { href: '/atm-collections', label: 'Branch status' };
    default: return { href: `/borrowers/${p.borrower_id}`, label: 'Open borrower' };
  }
}

/** May go out, or On hold with the short reason and "Why?"; then the next action. */
const Verdict: React.FC<{ p: PendingRelease }> = ({ p }) => {
  const action = nextAction(p);
  return (
    <div>
      {p.may_release
        ? <span className="inline-flex items-center gap-1.5 font-semibold text-success"><CheckCircle size={15} aria-hidden="true" strokeWidth={2.4} />May go out</span>
        : <>
          <span className="inline-flex items-center gap-1.5 font-semibold text-danger"><PauseCircle size={15} aria-hidden="true" strokeWidth={2.4} />On hold</span>
          <span className="block text-sm text-black dark:text-white">{shortReason(p)}</span>
          {p.reason && (
            <details className="mt-0.5 max-w-xs text-xs text-body">
              <summary className="cursor-pointer font-semibold text-primary underline-offset-2 hover:underline">Why?<span className="sr-only"> {p.borrower_name} is on hold</span></summary>
              <p className="mt-1">{p.reason}</p>
            </details>
          )}
        </>}
      <Link href={action.href} className={`mt-1.5 inline-flex min-h-10 items-center gap-1 text-sm ${LINK}`}>
        {action.label}<span className="sr-only"> for {p.borrower_name}</span><ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
};

const EmployerOf: React.FC<{ p: PendingRelease }> = ({ p }) => p.company_name
  ? <>{p.company_id ? <Link href={employerHref(p.company_id)} className={`block ${LINK}`}>{p.company_name}</Link> : <span className="block">{p.company_name}</span>}
    {p.company_status && <StandingPill status={p.company_status} companyMeaning={p.company_status === 'red' ? 'below the line' : p.company_status === 'green' ? 'above the line' : undefined} />}</>
  : <span className="italic text-body">No employer on file</span>;

const Borrower: React.FC<{ p: PendingRelease }> = ({ p }) => (
  <>
    <Link href={`/borrowers/${p.borrower_id}`} className={LINK}>{p.borrower_name}</Link>
    <Link href={`/loans-list/${p.loan_id}`} className="block w-fit text-xs text-body underline-offset-2 hover:text-primary hover:underline">{p.loan_ref ?? `Loan #${p.loan_id}`}</Link>
  </>
);

/** Loans waiting for release: cards on phones (verdict first), a table from md. */
export const LoanRows: React.FC<{ rows: PendingRelease[]; empty: string; label: string }> = ({ rows, empty, label }) => (
  <>
    <ul role="list" className="mt-3 space-y-3 md:hidden" aria-label={label}>
      {rows.map((p) => (
        <li key={p.loan_id} className="rounded-lg border border-stroke p-3 dark:border-strokedark">
          <Verdict p={p} />
          <div className="mt-2"><Borrower p={p} /></div>
          <p className="text-xs text-body">{p.branch_sub_name} · <span className="atm-num">₱{amt(p.loan_proceeds)}</span></p>
          <div className="mt-2 flex flex-wrap items-start gap-x-4 gap-y-2 text-sm">
            <div><span className="block text-[11px] font-bold uppercase tracking-wide text-body">Borrower</span><StandingPill status={p.person_status} /></div>
            <div><span className="block text-[11px] font-bold uppercase tracking-wide text-body">Employer</span><EmployerOf p={p} /></div>
          </div>
        </li>
      ))}
      {rows.length === 0 && <li className="py-6 text-center text-body">{empty}</li>}
    </ul>
    <div className="mt-3 hidden overflow-x-auto md:block">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-body">
          <tr><th className="py-2 pr-4">Borrower</th><th className="py-2 pr-4">Branch</th><th className="py-2 pr-4 text-right">Proceeds</th><th className="py-2 pr-4">Borrower standing</th><th className="py-2 pr-4">Employer</th><th className="py-2">Release</th></tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.loan_id} className="border-t border-stroke align-top dark:border-strokedark">
              <td className="py-2 pr-4"><Borrower p={p} /></td>
              <td className="py-2 pr-4">{p.branch_sub_name}</td>
              <td className="atm-num py-2 pr-4 text-right">₱{amt(p.loan_proceeds)}</td>
              <td className="py-2 pr-4"><StandingPill status={p.person_status} /></td>
              <td className="py-2 pr-4"><EmployerOf p={p} /></td>
              <td className="py-2"><Verdict p={p} /></td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-body">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  </>
);
