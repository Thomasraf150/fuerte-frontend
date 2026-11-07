"use client";

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DAILY_INCOME_STATEMENT, type DailyIncomeSection, type DailyIncomeSectionKey, type DailyIncomeStatement } from '@/graphql/CollectionReportsQueries';
import { amt, useGql } from '@/app/atm-collections/lib';
import '@/app/atm-collections/atm.css';

const manilaToday = () => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
const shift = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86400_000).toISOString().slice(0, 10);

const SECTIONS: { key: DailyIncomeSectionKey; title: string }[] = [
  { key: 'interest_income', title: 'Interest Income' },
  { key: 'other_revenues', title: 'Other Revenues' },
];
const DEDUCTIONS: { key: DailyIncomeSectionKey; title: string }[] = [
  { key: 'direct_financing', title: 'Less: Direct Financing Cost' },
  { key: 'expenses', title: 'Less: Expenses' },
];

/**
 * One day's income statement from the books (Day and Month to date), laid out as the monthly Income
 * Statement, with that day's summary ticket beside it: releasing fees and interest earned as the ticket
 * counts them, against what the books show. The day lives in the URL (?date=2026-11-06).
 */
const DailyIncomeHome: React.FC = () => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const today = manilaToday();
  const asked = params.get('date') ?? '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(asked) && asked <= today ? asked : today;
  const { data, error, loading } = useGql<{ dailyIncomeStatement: DailyIncomeStatement }>(DAILY_INCOME_STATEMENT, { date });
  const r = data?.dailyIncomeStatement;
  const go = (d: string) => router.replace(`${pathname}?date=${d}`);

  return (
    <div className="atm-root flex flex-col gap-6">
      <nav aria-label="Day" className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => go(shift(date, -1))} className="rounded-lg border border-stroke bg-white px-3 py-1.5 text-sm font-semibold dark:border-strokedark dark:bg-boxdark" aria-label="Previous day">← Previous day</button>
        <label htmlFor="dis-date" className="sr-only">Day</label>
        <input id="dis-date" type="date" value={date} max={today} min="2022-01-01" onChange={(e) => e.target.value && go(e.target.value)}
          className="rounded-lg border border-stroke bg-transparent px-3 py-1.5 text-sm dark:border-strokedark" />
        <button type="button" onClick={() => go(shift(date, 1))} disabled={date >= today} className="rounded-lg border border-stroke bg-white px-3 py-1.5 text-sm font-semibold disabled:opacity-40 dark:border-strokedark dark:bg-boxdark" aria-label="Next day">Next day →</button>
        {date !== today && <button type="button" onClick={() => go(today)} className="text-sm font-semibold text-primary hover:underline">Today</button>}
      </nav>

      {error && <p role="alert" className="rounded-lg bg-danger/10 p-4 text-danger">{error}</p>}
      {loading && !r && <p className="text-body">Reading the books…</p>}
      {r && (
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem]">
          <Statement r={r} />
          <TicketPanel r={r} />
        </div>
      )}
    </div>
  );
};

const Statement: React.FC<{ r: DailyIncomeStatement }> = ({ r }) => (
  <section aria-label={`Income statement, ${r.label}`} className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
    <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <h2 className="font-display text-2xl text-black dark:text-white">{r.label}</h2>
        <p className="text-sm text-body">From the books: live entries by journal date. Month to date is {r.month_label}.</p>
      </div>
      <p className={`font-display text-3xl ${r.totals.day.net_income.startsWith('-') ? 'text-danger' : 'text-success'}`}>
        <span className="sr-only">Net income for the day: </span>₱{amt(r.totals.day.net_income)}
      </p>
    </header>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-body">
          <tr><th className="py-2 pr-4">Account</th><th className="py-2 pr-4 text-right">This day</th><th className="py-2 text-right">Month to date</th></tr>
        </thead>
        <tbody>
          {SECTIONS.map((s) => <SectionRows key={s.key} title={s.title} section={r.sections[s.key]} />)}
          <TotalRow label="Total Income" day={r.totals.day.total_income} mtd={r.totals.month_to_date.total_income} />
          {DEDUCTIONS.map((s) => <SectionRows key={s.key} title={s.title} section={r.sections[s.key]} />)}
          <TotalRow label="Net Income before Other Income/(Expense)" day={r.totals.day.net_before_other} mtd={r.totals.month_to_date.net_before_other} />
          <SectionRows title="Other Income/(Expense)" section={r.sections.other_income_expense} />
          <TotalRow label="Net Income before Tax" day={r.totals.day.net_before_tax} mtd={r.totals.month_to_date.net_before_tax} />
          <SectionRows title="Less: Provision for Income Tax" section={r.sections.income_tax} />
          <TotalRow label="Net Income" day={r.totals.day.net_income} mtd={r.totals.month_to_date.net_income} strong />
        </tbody>
      </table>
    </div>
  </section>
);

const SectionRows: React.FC<{ title: string; section: DailyIncomeSection }> = ({ title, section }) => (
  <>
    <tr className="border-t border-stroke dark:border-strokedark"><th scope="rowgroup" colSpan={3} className="pt-4 pb-1 text-left font-display text-base text-black dark:text-white">{title}</th></tr>
    {section.lines.map((l) => (
      <tr key={l.number}>
        <td className="py-1 pr-4 pl-4"><span className="atm-num mr-2 text-xs text-body">{l.number}</span>{l.account_name}</td>
        <td className="atm-num py-1 pr-4 text-right">{amt(l.day, { blankZero: true })}</td>
        <td className="atm-num py-1 text-right">{amt(l.month_to_date, { blankZero: true })}</td>
      </tr>
    ))}
    {section.lines.length === 0 && <tr><td colSpan={3} className="py-1 pl-4 text-xs text-body">Nothing posted this month.</td></tr>}
  </>
);

const TotalRow: React.FC<{ label: string; day: string; mtd: string; strong?: boolean }> = ({ label, day, mtd, strong }) => (
  <tr className={strong ? 'atm-total' : 'border-t border-[var(--atm-rule-strong)] font-semibold'}>
    <td className="py-2 pr-4">{label}</td>
    <td className="atm-num py-2 pr-4 text-right">{amt(day)}</td>
    <td className="atm-num py-2 text-right">{amt(mtd)}</td>
  </tr>
);

/** The day's summary ticket income next to the books, so a difference shows. */
const TicketPanel: React.FC<{ r: DailyIncomeStatement }> = ({ r }) => {
  const t = r.ticket;
  const booksInterest = r.sections.interest_income.day;
  const matches = !t || /^-?0+(\.0+)?$/.test(t.interest_difference);
  return (
    <aside aria-labelledby="dis-ticket" className="self-start rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
      <h2 id="dis-ticket" className="font-display text-lg text-black dark:text-white">Summary ticket, same day</h2>
      {!t && <p className="mt-2 text-sm text-body">Open this for all branches (or one branch) to see the summary ticket beside it.</p>}
      {t && (
        <>
          <p className="text-sm text-body">{t.loans_released} loan{t.loans_released === 1 ? '' : 's'} released · ₱{amt(t.collection)} collected</p>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-body">Releasing income (as the ticket counts it)</h3>
          <dl className="mt-1 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-sm">
            {t.release_income.map((l) => (<React.Fragment key={l.description}><dt className="capitalize">{l.description}</dt><dd className="atm-num text-right">{amt(l.amount)}</dd></React.Fragment>))}
            {t.release_income.length === 0 && <><dt className="text-body">No releases this day</dt><dd /></>}
            <dt className="border-t border-stroke pt-1 font-semibold dark:border-strokedark">Total</dt><dd className="atm-num border-t border-stroke pt-1 text-right font-semibold dark:border-strokedark">{amt(t.release_income_total)}</dd>
          </dl>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-body">Interest earned</h3>
          <dl className="mt-1 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-sm">
            <dt>Summary ticket</dt><dd className="atm-num text-right">{amt(t.earned_interest)}</dd>
            <dt>Books (Interest Income)</dt><dd className="atm-num text-right">{amt(booksInterest)}</dd>
            <dt className="font-semibold">Difference</dt>
            <dd className={`atm-num text-right font-semibold ${matches ? 'text-success' : 'text-danger'}`}>{matches ? 'None' : amt(t.interest_difference)}</dd>
          </dl>
          <p className="mt-3 text-xs text-body">The ticket&apos;s udi line is one month of interest on loans released that day, not interest earned, so it is listed with the releasing income.</p>
        </>
      )}
    </aside>
  );
};

export default DailyIncomeHome;
