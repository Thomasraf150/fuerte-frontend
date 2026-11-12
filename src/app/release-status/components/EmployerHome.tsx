"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'react-feather';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import Pager from '@/components/CustomDatatable/Pager';
import { SkeletonBlock } from '@/components/LoadingStates';
import { EMPLOYER_STANDING, type EmployerBorrower, type EmployerStanding } from '@/graphql/CollectionReportsQueries';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { amt, useGql } from '@/app/atm-collections/lib';
import '@/app/atm-collections/atm.css';
import { Count, LoanRows, PAGE_SIZES, StandingPill, employerMeaning, usePage } from './parts';

const CARD = 'rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark';
const LINK = 'font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm';

/**
 * One employer, opened from Release Status (claude-docs/collections-reports.md): how it stands on the
 * last cut-off and what turns it Green, who is short (each with the payment to post), and its loans
 * waiting for release with the action that moves each one on. Totals count every branch; only the
 * user's branches' borrowers are listed.
 */
const EmployerHome: React.FC<{ id: string }> = ({ id }) => {
  const { data, error, loading } = useGql<{ employerStanding: EmployerStanding }>(EMPLOYER_STANDING, { company_id: id });
  const e = data?.employerStanding;
  useDocumentTitle(e?.company.company_name, 'Employer');

  return (
    <div className="atm-root flex flex-col gap-6">
      <div className="mx-auto w-full">
        <Breadcrumb pageName={e?.company.company_name ?? (error ? 'Employer' : '')} loading={!e && !error}
          items={[{ label: 'Dashboard', href: '/' }, { label: 'Release Status', href: '/release-status' }, { label: e?.company.company_name ?? 'Employer' }]} />
      </div>
      {error && <p role="alert" className="rounded-lg bg-danger/10 p-4 text-danger">{error}</p>}
      {loading && !e && <div className={CARD}><SkeletonBlock rows={6} label="Loading the employer…" /></div>}
      {e && <Standing e={e} />}
      {e && <Short e={e} />}
      {e && <Waiting e={e} />}
    </div>
  );
};

/** The headline: percent collected, against what, and how much more turns it Green. */
const Standing: React.FC<{ e: EmployerStanding }> = ({ e }) => {
  const c = e.company;
  const tone = c.status === 'red' ? 'text-danger' : c.status === 'green' ? 'text-success' : 'text-black dark:text-white';
  return (
    <section aria-label="Standing" className={`${CARD} flex flex-wrap items-end justify-between gap-4`}>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-body">{c.cutoff_label}</p>
        <p className={`font-display text-4xl leading-tight ${tone}`}>{c.status === 'none' ? 'No dues' : `${c.percent}% collected`}</p>
        <p className="text-sm text-body">
          {c.status === 'none'
            ? 'Nothing fell due from its borrowers in this cut-off.'
            : <>₱<span className="atm-num">{amt(c.paid)}</span> of ₱<span className="atm-num">{amt(c.due)}</span> due, from {c.borrowers} borrower{c.borrowers === 1 ? '' : 's'} at every branch.</>}
        </p>
        {c.status === 'red' && <p className="mt-1 text-sm font-semibold text-black dark:text-white">₱<span className="atm-num">{amt(e.amount_to_green)}</span> more collected turns it Green ({c.threshold}%).</p>}
      </div>
      <StandingPill status={c.status} companyMeaning={employerMeaning(c.status)} />
    </section>
  );
};

/** Its borrowers on the cut-off, largest shortfall first: who to follow up, and the payment to post. */
const Short: React.FC<{ e: EmployerStanding }> = ({ e }) => {
  const [shortOnly, setShortOnly] = useState(true);
  const short = e.borrowers.filter((b) => Number(b.short) > 0);
  const rows = shortOnly ? short : e.borrowers;
  const { slice, pager, reset } = usePage(rows, ['borrower', 'borrowers'], 'short');
  const empty = e.borrowers.length === 0 ? 'None of its borrowers are in your branches.' : 'Everyone here paid in full.';
  return (
    <section id="short" aria-labelledby="em-short" className={`scroll-mt-24 ${CARD}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="em-short" className="font-display text-lg text-black dark:text-white">Who is short this cut-off</h2>
          <p className="text-sm text-body"><Count n={short.length} label="short" tone="text-danger" /> of {e.borrowers.length} borrower{e.borrowers.length === 1 ? '' : 's'} in your branches.</p>
        </div>
        {e.borrowers.length > 0 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={shortOnly} onChange={(ev) => { setShortOnly(ev.target.checked); reset(); }} />Short only</label>}
      </div>
      {e.borrowers_elsewhere > 0 && <p className="mt-2 text-sm text-body">{e.borrowers_elsewhere} more borrower{e.borrowers_elsewhere === 1 ? ' is' : 's are'} at other branches: counted in the totals above, not listed here.</p>}
      <ul role="list" aria-label="Borrowers" className="mt-3 space-y-3 md:hidden">
        {slice.map((b) => (
          <li key={b.borrower_id} className="rounded-lg border border-stroke p-3 dark:border-strokedark">
            <div className="flex items-start justify-between gap-3"><BorrowerName b={b} /><ShortAmount b={b} /></div>
            <p className="text-xs text-body">{b.branch_sub_name} · paid <span className="atm-num">{amt(b.paid)}</span> of <span className="atm-num">{amt(b.due)}</span></p>
            <PostPayment b={b} />
          </li>
        ))}
        {rows.length === 0 && <li className="py-6 text-center text-body">{empty}</li>}
      </ul>
      <div className="mt-3 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-body">
            <tr><th className="py-2 pr-4">Borrower</th><th className="py-2 pr-4">Branch</th><th className="py-2 pr-4 text-right">Due</th><th className="py-2 pr-4 text-right">Paid</th><th className="py-2 pr-4 text-right">Short</th><th className="py-2">Next</th></tr>
          </thead>
          <tbody>
            {slice.map((b) => (
              <tr key={b.borrower_id} className="border-t border-stroke align-top dark:border-strokedark">
                <td className="py-2 pr-4"><BorrowerName b={b} /></td>
                <td className="py-2 pr-4">{b.branch_sub_name}</td>
                <td className="atm-num py-2 pr-4 text-right">{amt(b.due)}</td>
                <td className="atm-num py-2 pr-4 text-right">{amt(b.paid)}</td>
                <td className="py-2 pr-4 text-right"><ShortAmount b={b} /></td>
                <td className="py-2"><PostPayment b={b} inRow /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-body">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
      {rows.length > PAGE_SIZES[0] && <Pager pagination={pager} label="Pages of borrowers" />}
    </section>
  );
};

const BorrowerName: React.FC<{ b: EmployerBorrower }> = ({ b }) => <Link href={`/borrowers/${b.borrower_id}`} className={LINK}>{b.borrower_name}</Link>;

const ShortAmount: React.FC<{ b: EmployerBorrower }> = ({ b }) => Number(b.short) > 0
  ? <span className="atm-num font-semibold text-danger">{amt(b.short)}</span>
  : <span className="font-semibold text-success">Paid</span>;

/** A short borrower's payment goes to the loan of their schedule in the cut-off. In the table it lines up with its row; on a card it is a full-height tap target. */
const PostPayment: React.FC<{ b: EmployerBorrower; inRow?: boolean }> = ({ b, inRow }) => Number(b.short) > 0
  ? <Link href={`/payment-posting/${b.loan_id}`} className={`inline-flex items-center gap-1 text-sm ${inRow ? '' : 'mt-1 min-h-12'} ${LINK}`}>Post payment<span className="sr-only"> for {b.borrower_name}</span><ArrowRight size={14} aria-hidden="true" /></Link>
  : null;

/** Its loans waiting for release, held first, each with the action that moves it on. */
const Waiting: React.FC<{ e: EmployerStanding }> = ({ e }) => {
  const rows = useMemo(() => e.pending.slice().sort((a, b) => Number(a.may_release) - Number(b.may_release)), [e.pending]);
  const held = rows.filter((p) => !p.may_release).length;
  const { slice, pager } = usePage(rows, ['loan', 'loans'], 'waiting');
  return (
    <section id="waiting" aria-labelledby="em-waiting" className={`scroll-mt-24 ${CARD}`}>
      <h2 id="em-waiting" className="font-display text-lg text-black dark:text-white">Waiting for release here</h2>
      <p className="text-sm text-body">
        {rows.length} loan{rows.length === 1 ? '' : 's'} in your branches
        {rows.length > 0 && <> · <Count n={rows.length - held} label="may go out" tone="text-success" /> · <Count n={held} label="on hold" tone="text-danger" /></>}
      </p>
      <LoanRows rows={slice} empty="No loan from this employer is waiting for release." label="Loans waiting for release here" />
      {rows.length > PAGE_SIZES[0] && <Pager pagination={pager} label="Pages of loans waiting for release here" />}
    </section>
  );
};

export default EmployerHome;
