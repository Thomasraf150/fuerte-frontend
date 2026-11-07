"use client";

import React, { useMemo, useState } from 'react';
import { CheckCircle, PauseCircle } from 'react-feather';
import { RELEASE_STATUS, type ReleaseStatus, type Standing } from '@/graphql/CollectionReportsQueries';
import { amt, useGql } from '@/app/atm-collections/lib';
import '@/app/atm-collections/atm.css';

const STANDING: Record<Standing, { word: string; meaning: string; cls: string }> = {
  green: { word: 'Green', meaning: 'paying on time', cls: 'bg-success/10 text-success' },
  red: { word: 'Red', meaning: 'overdue', cls: 'bg-danger/10 text-danger' },
  new: { word: 'New', meaning: 'no loan history', cls: 'bg-[#2c6e86]/10 text-[#2c6e86]' },
  none: { word: 'No dues', meaning: 'nothing fell due', cls: 'bg-gray-2 text-body dark:bg-meta-4' },
};

/** The app's status pill, by standing: icon (for Red and Green), word, and what it means. */
const StandingPill: React.FC<{ status: Standing; companyMeaning?: string }> = ({ status, companyMeaning }) => {
  const s = STANDING[status];
  const Icon = status === 'green' ? CheckCircle : status === 'red' ? PauseCircle : null;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {Icon && <Icon size={14} aria-hidden="true" strokeWidth={2.4} />}
      {s.word}{' '}<span className="font-normal opacity-80">· {companyMeaning ?? s.meaning}</span>
    </span>
  );
};

/**
 * Treasury's view before releasing funds (claude-docs/collections-reports.md): every loan waiting for
 * release with whether it may go out and why not, and every employer's Red/Green on the last cut-off.
 * The same rules refuse the release itself on the loan page; there is no override.
 */
const ReleaseStatusHome: React.FC = () => {
  const { data, error, loading } = useGql<{ releaseStatus: ReleaseStatus }>(RELEASE_STATUS, {});
  const r = data?.releaseStatus;

  return (
    <div className="atm-root flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-body">
        No release for a borrower in the red (amortization overdue). At an employer in the red, only borrowers paying on time are released.
        A branch in the red releases nothing. Employers are judged on {r ? r.cutoff_label : 'the last cut-off'}, at {r?.threshold ?? '80'}% collected.
      </p>
      {error && <p role="alert" className="rounded-lg bg-danger/10 p-4 text-danger">{error}</p>}
      {loading && !r && <p className="text-body">Checking every loan waiting for release…</p>}
      {r && <Pending r={r} />}
      {r && <Companies r={r} />}
    </div>
  );
};

const Pending: React.FC<{ r: ReleaseStatus }> = ({ r }) => {
  const held = r.pending.filter((p) => !p.may_release);
  return (
    <section aria-labelledby="rs-pending" className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
      <h2 id="rs-pending" className="font-display text-lg text-black dark:text-white">Waiting for release</h2>
      <p className="text-sm text-body">
        {r.pending.length} loan{r.pending.length === 1 ? '' : 's'} for releasing
        {r.pending.length > 0 && <> · <strong className="text-success">{r.pending.length - held.length} may go out</strong> · <strong className="text-danger">{held.length} on hold</strong></>}
      </p>
      {r.pending_truncated && <p role="status" className="mt-1 text-sm font-semibold text-[#8A6312]">More loans are waiting than this list shows (the first {r.pending.length}, by branch). Release some, or open a branch&apos;s loans list.</p>}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-body">
            <tr><th className="py-2 pr-4">Borrower</th><th className="py-2 pr-4">Branch</th><th className="py-2 pr-4 text-right">Proceeds</th><th className="py-2 pr-4">Borrower standing</th><th className="py-2 pr-4">Employer</th><th className="py-2">Release</th></tr>
          </thead>
          <tbody>
            {r.pending.map((p) => (
              <tr key={p.loan_id} className="border-t border-stroke align-top dark:border-strokedark">
                <td className="py-2 pr-4"><span className="font-semibold text-black dark:text-white">{p.borrower_name}</span><span className="block text-xs text-body">{p.loan_ref ?? `Loan #${p.loan_id}`}</span></td>
                <td className="py-2 pr-4">{p.branch_sub_name}</td>
                <td className="atm-num py-2 pr-4 text-right">₱{amt(p.loan_proceeds)}</td>
                <td className="py-2 pr-4"><StandingPill status={p.person_status} /></td>
                <td className="py-2 pr-4">{p.company_name ? <><span className="block">{p.company_name}</span>{p.company_status && <StandingPill status={p.company_status} companyMeaning={p.company_status === 'red' ? 'below the line' : undefined} />}</> : <span className="italic text-body">None on file</span>}</td>
                <td className="py-2">
                  {p.may_release
                    ? <span className="font-semibold text-success">May release</span>
                    : <><span className="font-semibold text-danger">On hold</span><span className="block max-w-xs text-xs text-body">{p.reason}</span></>}
                </td>
              </tr>
            ))}
            {r.pending.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-body">No loan is waiting for release.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const Companies: React.FC<{ r: ReleaseStatus }> = ({ r }) => {
  const [search, setSearch] = useState('');
  const [redOnly, setRedOnly] = useState(true);
  const reds = r.companies.filter((c) => c.status === 'red').length;
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return r.companies.filter((c) => (!redOnly || c.status === 'red') && (!q || c.company_name.toLowerCase().includes(q)));
  }, [r.companies, search, redOnly]);
  return (
    <section aria-labelledby="rs-companies" className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="rs-companies" className="font-display text-lg text-black dark:text-white">Employers · {r.cutoff_label}</h2>
          <p className="text-sm text-body">{reds} of {r.companies.length} employers with amortization due are in the red.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={redOnly} onChange={(e) => setRedOnly(e.target.checked)} />Red only</label>
          <label htmlFor="rs-company-search" className="font-semibold text-black dark:text-white">Find an employer
            <input id="rs-company-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. New Balance"
              className="ml-2 rounded-lg border border-stroke bg-transparent px-3 py-1.5 font-normal dark:border-strokedark" />
          </label>
        </div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-body">
            <tr><th className="py-2 pr-4">Employer</th><th className="py-2 pr-4 text-right">Due</th><th className="py-2 pr-4 text-right">Paid</th><th className="py-2 pr-4 text-right">Collected</th><th className="py-2">Status</th></tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.company_id} className="border-t border-stroke dark:border-strokedark">
                <td className="py-2 pr-4"><span className="font-semibold text-black dark:text-white">{c.company_name}</span><span className="ml-2 text-xs text-body">{c.borrowers} borrower{c.borrowers === 1 ? '' : 's'}</span></td>
                <td className="atm-num py-2 pr-4 text-right">{amt(c.due)}</td>
                <td className="atm-num py-2 pr-4 text-right">{amt(c.paid)}</td>
                <td className={`atm-num py-2 pr-4 text-right font-semibold ${c.status === 'red' ? 'text-danger' : 'text-success'}`}>{c.percent}%</td>
                <td className="py-2"><StandingPill status={c.status} companyMeaning={c.status === 'red' ? 'only on-time payers released' : c.status === 'green' ? 'releases allowed' : undefined} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-body">{redOnly ? 'No employer is in the red.' : 'No employer matches.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ReleaseStatusHome;
