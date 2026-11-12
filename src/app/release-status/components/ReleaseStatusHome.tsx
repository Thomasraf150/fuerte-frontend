"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, CheckCircle, PauseCircle } from 'react-feather';
import Pager from '@/components/CustomDatatable/Pager';
import { RELEASE_STATUS, type ReleaseStatus } from '@/graphql/CollectionReportsQueries';
import { Count, LoanRows, PAGE_SIZES, StandingPill, employerHref, employerMeaning, usePage } from './parts';
import { amt, useGql } from '@/app/atm-collections/lib';
import '@/app/atm-collections/atm.css';
import { SkeletonBlock } from '@/components/LoadingStates';

/** Scrolls to a section and moves focus to its heading, so keyboard and screen-reader users land there too. */
function showSection(id: string): boolean {
  const section = document.getElementById(id);
  if (!section) return false;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  section.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  section.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  return true;
}

function jumpTo(id: string) {
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!showSection(id)) return;
    e.preventDefault();
    window.history.replaceState(null, '', `#${id}`);
  };
}

/**
 * A card's headline. Its words and its colour say the same thing (red only for something on hold or
 * in the red, green only for "may go out" / "above the line", neutral when there is nothing to judge),
 * and an icon carries the status too, never the colour alone.
 */
type Headline = { text: string; tone: 'danger' | 'success' | 'neutral' };
const TONE: Record<Headline['tone'], { cls: string; Icon: typeof CheckCircle | null }> = {
  danger: { cls: 'text-danger', Icon: PauseCircle },
  success: { cls: 'text-success', Icon: CheckCircle },
  neutral: { cls: 'text-black dark:text-white', Icon: null },
};

/**
 * One index card of the "On this page" header: the section's headline, a thin bar of its split
 * (green part / red part), and where it leads. The whole card is the link.
 */
const JumpCard: React.FC<{
  title: string; target: string; headline: Headline;
  detail: string; green: number; red: number; cta: string;
}> = ({ title, target, headline, detail, green, red, cta }) => {
  const total = green + red;
  const { cls, Icon } = TONE[headline.tone];
  return (
    <a href={`#${target}`} onClick={jumpTo(target)}
      className="group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-stroke bg-white p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-strokedark dark:bg-boxdark">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-body">{title}</span>
      <span className={`flex items-center gap-2 font-display text-3xl leading-none ${cls}`}>
        {Icon && <Icon size={24} aria-hidden="true" strokeWidth={2.2} className="shrink-0" />}{headline.text}
      </span>
      <span className="text-sm text-body">{detail}</span>
      {total > 0 && (
        <span aria-hidden="true" className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full bg-gray-2 dark:bg-meta-4">
          <span className="bg-success" style={{ width: `${(green / total) * 100}%` }} />
          <span className="bg-danger" style={{ width: `${(red / total) * 100}%` }} />
        </span>
      )}
      <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        {cta}<ArrowDown size={15} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-y-0.5 motion-reduce:transition-none" />
      </span>
    </a>
  );
};

/** How many loans are on hold and employers in the red: counted once, for the header and the sections. */
type Counts = { held: number; reds: number };

const OnThisPage: React.FC<{ r: ReleaseStatus; counts: Counts }> = ({ r, counts: { held, reds } }) => {
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const loans = r.pending.length;
  const employers = r.companies.length;
  const loanHeadline: Headline = held > 0 ? { text: `${held} on hold`, tone: 'danger' }
    : loans > 0 ? { text: loans === 1 ? 'It may go out' : `All ${loans} may go out`, tone: 'success' }
    : { text: 'Nothing waiting', tone: 'neutral' };
  const employerHeadline: Headline = reds > 0 ? { text: `${reds} in the red`, tone: 'danger' }
    : employers > 0 ? { text: `All ${employers} at or above ${r.threshold}%`, tone: 'success' }
    : { text: 'No dues this cut-off', tone: 'neutral' };
  return (
    <nav aria-label="On this page" className="grid gap-4 md:grid-cols-2">
      <JumpCard title="Waiting for release" target="waiting"
        headline={loanHeadline}
        detail={loans === 0 ? 'No loan is marked For Releasing.' : held > 0 ? `of ${plural(loans, 'loan', 'loans')} for releasing · ${loans - held} may go out` : `${plural(loans, 'loan', 'loans')} for releasing`}
        green={r.pending.length - held} red={held} cta="See the loans" />
      <JumpCard title={`Employers · ${r.cutoff_label}`} target="employers"
        headline={employerHeadline}
        detail={employers === 0 ? 'No employer had amortization due in this cut-off.' : reds > 0 ? `of ${plural(employers, 'employer', 'employers')} with amortization due` : `${plural(employers, 'employer', 'employers')} with amortization due`}
        green={r.companies.length - reds} red={reds} cta="See the employers" />
    </nav>
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
  const counts = useMemo<Counts | null>(() => r ? {
    held: r.pending.filter((p) => !p.may_release).length,
    reds: r.companies.filter((c) => c.status === 'red').length,
  } : null, [r]);
  // 1: the sections exist only once the answer arrives, after the browser's own scroll to the
  // address's #waiting / #employers, so a bookmarked or sent link is honoured here.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (r && (id === 'waiting' || id === 'employers')) showSection(id);
  }, [r]);

  return (
    <div className="atm-root flex flex-col gap-6">
      <ul aria-label="Release rules" className="max-w-3xl list-disc space-y-0.5 pl-5 text-sm text-black/80 dark:text-white/80">
        <li>Borrower overdue on amortization: no release.</li>
        <li>Employer in the red (below {r?.threshold ?? '80'}% collected on {r ? r.cutoff_label : 'the last cut-off'}): only its borrowers paying on time are released.</li>
        <li>Branch in the red: no release at all.</li>
      </ul>
      {error && <p role="alert" className="rounded-lg bg-danger/10 p-4 text-danger">{error}</p>}
      {loading && !r && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark"><SkeletonBlock rows={3} label="Checking every loan waiting for release…" /></div>
            <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark" aria-hidden="true"><SkeletonBlock rows={3} label="" /></div>
          </div>
          <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark" aria-hidden="true"><SkeletonBlock rows={6} label="" /></div>
        </div>
      )}
      {r && counts && <OnThisPage r={r} counts={counts} />}
      {r && counts && <Pending r={r} held={counts.held} />}
      {r && counts && <Companies r={r} reds={counts.reds} />}
    </div>
  );
};

type Show = 'all' | 'held' | 'out';
const SHOW: { value: Show; label: string }[] = [{ value: 'all', label: 'All' }, { value: 'held', label: 'On hold' }, { value: 'out', label: 'May go out' }];

const Pending: React.FC<{ r: ReleaseStatus; held: number }> = ({ r, held }) => {
  const [show, setShow] = useState<Show>('all');
  // Held loans first (each group keeps the server's branch order): they are the ones to act on.
  const rows = useMemo(() => (show === 'all' ? r.pending : r.pending.filter((p) => (show === 'held') !== p.may_release))
    .slice().sort((a, b) => Number(a.may_release) - Number(b.may_release)), [r.pending, show]);
  const empty = r.pending.length === 0 ? 'No loan is waiting for release.' : show === 'held' ? 'No loan is on hold.' : 'No loan may go out yet.';
  const { slice, pager, reset } = usePage(rows, ['loan', 'loans'], 'waiting');
  return (
    <section id="waiting" aria-labelledby="rs-pending" className="scroll-mt-24 rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
      <h2 id="rs-pending" tabIndex={-1} className="focus:outline-none font-display text-lg text-black dark:text-white">Waiting for release</h2>
      <p className="text-sm text-body">
        {r.pending.length} loan{r.pending.length === 1 ? '' : 's'} for releasing
        {r.pending.length > 0 && <> · <Count n={r.pending.length - held} label="may go out" tone="text-success" /> · <Count n={held} label="on hold" tone="text-danger" /></>}
      </p>
      {r.pending.length > 0 && (
        <div role="group" aria-label="Show loans" className="mt-3 flex flex-wrap gap-2">
          {SHOW.map((o) => (
            <button key={o.value} type="button" aria-pressed={show === o.value} onClick={() => { setShow(o.value); reset(); }}
              className={`min-h-12 rounded border px-3 text-sm font-medium lg:min-h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${show === o.value ? 'border-primary bg-primary text-white' : 'border-stroke bg-white text-black hover:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white'}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
      {r.pending_truncated && <p role="status" className="mt-1 text-sm font-semibold text-[#8A6312]">More loans are waiting than this list shows (the first {r.pending.length}, by branch). Release some, or open a branch&apos;s loans list.</p>}
      <LoanRows rows={slice} empty={empty} label="Loans waiting for release" />
      {rows.length > PAGE_SIZES[0] && <Pager pagination={pager} label="Pages of loans waiting for release" />}
    </section>
  );
};

const Companies: React.FC<{ r: ReleaseStatus; reds: number }> = ({ r, reds }) => {
  const [search, setSearch] = useState('');
  const [redOnly, setRedOnly] = useState(true);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return r.companies.filter((c) => (!redOnly || c.status === 'red') && (!q || c.company_name.toLowerCase().includes(q)));
  }, [r.companies, search, redOnly]);
  const { slice, pager, reset } = usePage(rows, ['employer', 'employers'], 'employers');
  const empty = redOnly ? 'No employer is in the red.' : 'No employer matches.';
  return (
    <section id="employers" aria-labelledby="rs-companies" className="scroll-mt-24 rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="rs-companies" tabIndex={-1} className="focus:outline-none font-display text-lg text-black dark:text-white">Employers · {r.cutoff_label}</h2>
          <p className="text-sm text-body">{r.companies.length === 0
            ? 'No employer had amortization due in this cut-off.'
            : <><Count n={reds} label="in the red" tone="text-danger" /> of {r.companies.length} employers with amortization due.</>}</p>
        </div>
        {r.companies.length > 0 && <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={redOnly} onChange={(e) => { setRedOnly(e.target.checked); reset(); }} />Red only</label>
          <label htmlFor="rs-company-search" className="font-semibold text-black dark:text-white">Find an employer
            <input id="rs-company-search" type="search" value={search} onChange={(e) => { setSearch(e.target.value); reset(); }} placeholder="e.g. New Balance"
              className="ml-2 rounded-lg border border-stroke bg-transparent px-3 py-1.5 font-normal dark:border-strokedark" />
          </label>
        </div>}
      </div>
      {r.companies.length > 0 && <ul role="list" className="mt-3 space-y-3 md:hidden" aria-label="Employers">
        {slice.map((c) => (
          <li key={c.company_id} className="rounded-lg border border-stroke p-3 dark:border-strokedark">
            <div className="flex items-start justify-between gap-3">
              <Link href={employerHref(c.company_id)} className="font-semibold text-primary underline-offset-2 hover:underline">{c.company_name}</Link>
              <span className={`atm-num font-semibold ${c.status === 'red' ? 'text-danger' : 'text-success'}`}>{c.percent}%</span>
            </div>
            <p className="text-xs text-body">{c.borrowers} borrower{c.borrowers === 1 ? '' : 's'} · paid <span className="atm-num">{amt(c.paid)}</span> of <span className="atm-num">{amt(c.due)}</span></p>
            <div className="mt-2"><StandingPill status={c.status} companyMeaning={employerMeaning(c.status)} /></div>
          </li>
        ))}
        {rows.length === 0 && <li className="py-6 text-center text-body">{empty}</li>}
      </ul>}
      {r.companies.length > 0 && <div className="mt-3 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-body">
            <tr><th className="py-2 pr-4">Employer</th><th className="py-2 pr-4 text-right">Due</th><th className="py-2 pr-4 text-right">Paid</th><th className="py-2 pr-4 text-right">Collected</th><th className="py-2">Status</th></tr>
          </thead>
          <tbody>
            {slice.map((c) => (
              <tr key={c.company_id} className="border-t border-stroke dark:border-strokedark">
                <td className="py-2 pr-4"><Link href={employerHref(c.company_id)} className="font-semibold text-primary underline-offset-2 hover:underline">{c.company_name}</Link><span className="ml-2 text-xs text-body">{c.borrowers} borrower{c.borrowers === 1 ? '' : 's'}</span></td>
                <td className="atm-num py-2 pr-4 text-right">{amt(c.due)}</td>
                <td className="atm-num py-2 pr-4 text-right">{amt(c.paid)}</td>
                <td className={`atm-num py-2 pr-4 text-right font-semibold ${c.status === 'red' ? 'text-danger' : 'text-success'}`}>{c.percent}%</td>
                <td className="py-2"><StandingPill status={c.status} companyMeaning={employerMeaning(c.status)} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-body">{empty}</td></tr>}
          </tbody>
        </table>
      </div>}
      {rows.length > PAGE_SIZES[0] && <Pager pagination={pager} label="Pages of employers" />}
    </section>
  );
};

export default ReleaseStatusHome;
