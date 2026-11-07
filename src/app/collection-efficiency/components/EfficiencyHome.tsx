"use client";

import React, { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { COLLECTION_EFFICIENCY, type CollectionEfficiency, type EfficiencyFigures } from '@/graphql/CollectionReportsQueries';
import { amt, useGql } from '@/app/atm-collections/lib';
import { RateMeter } from '@/app/atm-collections/components/RateBits';
import '@/app/atm-collections/atm.css';

/** "YYYY-MM" of the month before today's (Manila), the default: the last month that has ended. */
function lastMonth(): string {
  const now = new Date(Date.now() + 8 * 3600_000);
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
}

function monthsBack(from: string, n: number): string[] {
  const [y, m] = from.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(y, m - 1 - i, 1)).toISOString().slice(0, 7));
}

const monthName = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const green = (percent: string, threshold: string) => Number(percent) >= Number(threshold);

/**
 * Collection efficiency for a month: the amortization that fell due (target) against what was paid on it
 * (actual), on time and to date, for the whole book, by sub-branch and by employer company. The month
 * lives in the URL (?month=2026-10), so a link answers "what was October's?" directly.
 */
const EfficiencyHome: React.FC = () => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const month = /^\d{4}-\d{2}$/.test(params.get('month') ?? '') ? String(params.get('month')) : lastMonth();
  const { data, error, loading } = useGql<{ collectionEfficiency: CollectionEfficiency }>(COLLECTION_EFFICIENCY, { month });
  const r = data?.collectionEfficiency;
  const setMonth = (m: string) => router.replace(`${pathname}?month=${m}`);
  const thisMonth = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 7);

  return (
    <div className="atm-root flex flex-col gap-6">
      <nav aria-label="Month" className="flex flex-wrap items-end gap-2">
        {monthsBack(thisMonth, 4).map((m) => (
          <button key={m} type="button" onClick={() => setMonth(m)} aria-pressed={m === month}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${m === month ? 'bg-primary text-white' : 'border border-stroke bg-white text-black hover:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white'}`}>
            {monthName(m)}{m === thisMonth ? ' (so far)' : ''}
          </button>
        ))}
        <label htmlFor="eff-month" className="ml-auto text-sm font-semibold text-black dark:text-white">Other month
          <input id="eff-month" type="month" value={month} max={thisMonth} min="2022-01" onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="ml-2 rounded-lg border border-stroke bg-transparent px-3 py-1.5 font-normal dark:border-strokedark" />
        </label>
      </nav>

      {error && <p role="alert" className="rounded-lg bg-danger/10 p-4 text-danger">{error}</p>}
      {loading && !r && <p className="text-body">Working out {monthName(month)}…</p>}
      {r && <Headline r={r} />}
      {r && <BranchTable r={r} />}
      {r && <CompanyTable r={r} />}
    </div>
  );
};

const Headline: React.FC<{ r: CollectionEfficiency }> = ({ r }) => {
  const t = r.total;
  const ok = green(t.percent_on_time, r.threshold);
  const inProgress = r.on_time_as_of < r.to;
  return (
    <section aria-label={`Collection efficiency, ${r.label}`} className="atm-card grid gap-6 rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div>
        <p className="text-sm text-body">Collection efficiency · {r.label}{inProgress ? ' (so far)' : ''}</p>
        <p className={`font-display text-6xl leading-tight ${ok ? 'text-success' : 'text-danger'}`}>{t.percent_on_time}%</p>
        <p className="text-sm text-body">collected on time, of the amortization that fell due{inProgress ? ` up to ${r.on_time_as_of}` : ''}.</p>
        <RateMeter percent={t.percent_on_time} threshold={r.threshold} green={ok} />
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 self-center text-sm">
        <Fig label="Target (due)" value={`₱${amt(t.due)}`} />
        <Fig label="Collected on time" value={`₱${amt(t.paid_on_time)}`} />
        <Fig label="Collected to date" value={`₱${amt(t.paid_to_date)}`} note={`${t.percent_to_date}% with late payments`} />
        <Fig label="Still unpaid" value={`₱${amt(t.unpaid)}`} />
        <Fig label="Borrowers due" value={String(t.borrowers)} note={`${t.schedules} amortizations`} />
      </dl>
    </section>
  );
};

const Fig: React.FC<{ label: string; value: string; note?: string }> = ({ label, value, note }) => (
  <div>
    <dt className="text-body">{label}</dt>
    <dd className="atm-num font-display text-xl text-black dark:text-white">{value}</dd>
    {note && <dd className="text-xs text-body">{note}</dd>}
  </div>
);

/** A percent with a small bar, coloured against the release line. */
const Pct: React.FC<{ value: string; threshold: string }> = ({ value, threshold }) => (
  <span className="inline-flex items-center justify-end gap-2">
    <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-[#ece6d6] sm:inline-block" aria-hidden="true">
      <span className="block h-full rounded-full" style={{ width: `${Math.min(100, Number(value))}%`, background: green(value, threshold) ? 'var(--atm-green)' : 'var(--atm-red)' }} />
    </span>
    <span className={`atm-num font-semibold ${green(value, threshold) ? 'text-success' : 'text-danger'}`}>{value}%</span>
  </span>
);

const FigureCells: React.FC<{ f: EfficiencyFigures; threshold: string }> = ({ f, threshold }) => (
  <>
    <td className="atm-num py-2 pr-4 text-right">{amt(f.due)}</td>
    <td className="atm-num py-2 pr-4 text-right">{amt(f.paid_on_time)}</td>
    <td className="py-2 pr-4 text-right"><Pct value={f.percent_on_time} threshold={threshold} /></td>
    <td className="atm-num py-2 pr-4 text-right">{amt(f.paid_to_date)}</td>
    <td className="atm-num py-2 pr-4 text-right text-body">{f.percent_to_date}%</td>
    <td className="atm-num py-2 text-right">{amt(f.unpaid)}</td>
  </>
);

const FigureHeads: React.FC = () => (
  <>
    <th className="py-2 pr-4 text-right">Target</th><th className="py-2 pr-4 text-right">On time</th><th className="py-2 pr-4 text-right">Efficiency</th>
    <th className="py-2 pr-4 text-right">To date</th><th className="py-2 pr-4 text-right">With late</th><th className="py-2 text-right">Unpaid</th>
  </>
);

const BranchTable: React.FC<{ r: CollectionEfficiency }> = ({ r }) => (
  <section aria-labelledby="eff-branches" className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
    <h2 id="eff-branches" className="font-display text-lg text-black dark:text-white">By branch</h2>
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-body"><tr><th className="py-2 pr-4">Sub-branch</th><FigureHeads /></tr></thead>
        <tbody>
          {r.by_branch.map((b) => (
            <tr key={b.branch_sub_id} className="border-t border-stroke dark:border-strokedark">
              <td className="py-2 pr-4">
                <span className="font-semibold text-black dark:text-white">{b.branch_sub_name}</span>
                <span className="ml-2 text-xs text-body">{[b.group_code, b.branch_name].filter(Boolean).join(' · ')}</span>
              </td>
              <FigureCells f={b} threshold={r.threshold} />
            </tr>
          ))}
          {r.by_branch.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-body">Nothing fell due in {r.label}.</td></tr>}
        </tbody>
      </table>
    </div>
  </section>
);

const CompanyTable: React.FC<{ r: CollectionEfficiency }> = ({ r }) => {
  const [search, setSearch] = useState('');
  const [all, setAll] = useState(false);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? r.by_company.filter((c) => c.company_name.toLowerCase().includes(q)) : r.by_company;
  }, [r.by_company, search]);
  const shown = all || search ? rows : rows.slice(0, 25);
  return (
    <section aria-labelledby="eff-companies" className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="eff-companies" className="font-display text-lg text-black dark:text-white">By employer</h2>
          <p className="text-sm text-body">Largest target first. {r.by_company.length} employers had amortization due.</p>
        </div>
        <label htmlFor="eff-company-search" className="text-sm font-semibold text-black dark:text-white">Find an employer
          <input id="eff-company-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. New Balance"
            className="ml-2 rounded-lg border border-stroke bg-transparent px-3 py-1.5 font-normal dark:border-strokedark" />
        </label>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-body"><tr><th className="py-2 pr-4">Employer</th><FigureHeads /></tr></thead>
          <tbody>
            {shown.map((c) => (
              <tr key={c.company_id ?? 'none'} className="border-t border-stroke dark:border-strokedark">
                <td className="py-2 pr-4">
                  <span className={c.company_id ? 'font-semibold text-black dark:text-white' : 'italic text-body'}>{c.company_name}</span>
                  <span className="ml-2 text-xs text-body">{c.borrowers} borrower{c.borrowers === 1 ? '' : 's'}</span>
                </td>
                <FigureCells f={c} threshold={r.threshold} />
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-body">No employer matches “{search}”.</td></tr>}
          </tbody>
        </table>
      </div>
      {!all && !search && rows.length > 25 && (
        <button type="button" onClick={() => setAll(true)} className="mt-3 text-sm font-semibold text-primary hover:underline">Show all {rows.length} employers</button>
      )}
    </section>
  );
};

export default EfficiencyHome;
