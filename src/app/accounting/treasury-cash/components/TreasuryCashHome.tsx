"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardBody } from '@/components/Card';
import ErrorAlert from '@/components/ErrorAlert';
import { SkeletonBlock } from '@/components/LoadingStates';
import { rt, indent } from '@/components/ReportTable';
import BranchQueryMutations from '@/graphql/BranchQueryMutation';
import { TREASURY_CASH_REPORT, type TreasuryCashAmounts, type TreasuryCashLine, type TreasuryCashReport, type TreasuryCutoff } from '@/graphql/TreasuryCashQueries';
import { fetchWithRecache } from '@/utils/helper';
import { manilaToday } from '@/utils/reportPeriod';

/**
 * Treasury cash report (claude-docs/treasury-cash-report.md): every cash account's beginning
 * balance, deposits, disbursements, moves between cash accounts and ending balance for a month or
 * a cut-off, from the books. The period and branch live in the URL (?month=2026-10&cutoff=first&branch=44),
 * so Back, refresh and a pasted link reopen the same report.
 */

const CUTOFFS: { value: TreasuryCutoff; label: string }[] = [
  { value: 'whole', label: 'Whole month' },
  { value: 'first', label: '1–15' },
  { value: 'second', label: '16–end' },
];

const COLUMNS: { key: keyof TreasuryCashAmounts; label: string }[] = [
  { key: 'beginning', label: 'Beginning' },
  { key: 'deposits', label: 'Deposits' },
  { key: 'disbursements', label: 'Disbursements' },
  { key: 'transfers', label: 'Transfers' },
  { key: 'ending', label: 'Ending' },
];

/** Accounts grouped as treasury reads them; the 010101 header's own postings come last. */
const GROUPS = [
  { title: 'Cash on hand', test: /cash on hand/i },
  { title: 'Cash in bank', test: /cash in bank/i },
  { title: 'Petty cash fund', test: /petty cash/i },
  { title: 'Posted to the Cash header (010101)', test: /.*/ },
];

const peso = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const isZero = (s: string) => Number(s) === 0;
/** −₱1,234.50 with a true minus sign; display only, the server did the arithmetic in BCMath. */
const money = (s: string) => `${Number(s) < 0 ? '−' : ''}₱${peso.format(Math.abs(Number(s)))}`;
const signed = (s: string) => (Number(s) > 0 ? `+${money(s)}` : money(s));
/** "2026-10-01" → "Oct 1": the bridge's day labels (the year is in the heading). */
const dayLabel = (ymd: string) =>
  new Date(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10)))
    .toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
/** Column totals for a group, in centavos so float drift never shows. */
const sumOf = (lines: TreasuryCashLine[]): TreasuryCashAmounts =>
  Object.fromEntries(COLUMNS.map(({ key }) => [key,
    (lines.reduce((c, l) => c + Math.round(Number(l[key]) * 100), 0) / 100).toFixed(2)])) as unknown as TreasuryCashAmounts;

const readPeriod = (params: URLSearchParams | null) => {
  const thisMonth = manilaToday().slice(0, 7);
  const asked = params?.get('month') ?? '';
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(asked) && asked >= '2022-01' && asked <= thisMonth ? asked : thisMonth;
  const cut = params?.get('cutoff') ?? '';
  const cutoff: TreasuryCutoff = cut === 'first' || cut === 'second' ? cut : 'whole';
  const branch = /^\d+$/.test(params?.get('branch') ?? '') ? String(params?.get('branch')) : '';
  return { month, cutoff, branch, thisMonth };
};

const errorOf = (res: any): string | null => {
  const e = res?.errors?.[0];
  if (!e) return null;
  const validation = e.extensions?.validation ? Object.values(e.extensions.validation).flat()[0] : null;
  return String(validation ?? e.message ?? 'The cash report did not load.');
};

const gql = (query: string, variables: Record<string, unknown>) =>
  fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }),
  });

const TreasuryCashHome: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { month, cutoff, branch, thisMonth } = readPeriod(useSearchParams());
  // The report on screen and the branch it was loaded for: while the next one loads, the heading
  // keeps naming the branch the figures belong to, and a slow earlier answer never replaces a newer one.
  const [shown, setShown] = useState<{ report: TreasuryCashReport; branch: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const latest = useRef(0);

  const go = (next: Partial<{ month: string; cutoff: string; branch: string }>) => {
    const q = { month, cutoff, branch, ...next };
    router.replace(`${pathname}?month=${q.month}&cutoff=${q.cutoff}${q.branch ? `&branch=${q.branch}` : ''}`);
  };

  const load = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    setError(null);
    let problem: string | null;
    let report: TreasuryCashReport | null = null;
    try {
      const res = await gql(TREASURY_CASH_REPORT, { month, cutoff, branch_sub_id: branch || null });
      problem = errorOf(res);
      report = problem ? null : res?.data?.treasuryCashReport ?? null;
    } catch (e) {
      problem = e instanceof Error ? e.message : 'The cash report did not load.';
    }
    if (request !== latest.current) return; // a newer period or branch was picked meanwhile
    setError(problem);
    setShown(report ? { report, branch } : null);
    setLoading(false);
  }, [month, cutoff, branch]);

  useEffect(() => { load(); }, [load]);

  // A link with an unusable month, cut-off or branch is rewritten to what is actually shown.
  const query = useSearchParams()?.toString() ?? '';
  useEffect(() => {
    const canonical = `month=${month}&cutoff=${cutoff}${branch ? `&branch=${branch}` : ''}`;
    if (query !== canonical) router.replace(`${pathname}?${canonical}`);
  }, [query, month, cutoff, branch, pathname, router]);

  useEffect(() => {
    gql(BranchQueryMutations.GET_MY_ACCESSIBLE_BRANCH_SUBS_QUERY, {})
      .then((res) => setBranches(res?.data?.getMyAccessibleBranchSubs ?? []))
      .catch(() => setBranches([])); // the report still works for "All my branches"
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <Controls month={month} cutoff={cutoff} branch={branch} thisMonth={thisMonth} branches={branches} onChange={go} />
      {error && <ErrorAlert title="The cash report didn't load." detail={error} onRetry={load} />}
      {loading && !shown && <SkeletonBlock rows={8} label="Loading the cash report…" />}
      {shown && (
        <div className={`flex flex-col gap-6 transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
          <Bridge report={shown.report} branchName={shown.branch
            ? branches.find((b) => String(b.id) === shown.branch)?.name ?? `Branch #${shown.branch}`
            : 'All my branches'} />
          <Statement report={shown.report} />
        </div>
      )}
    </div>
  );
};

interface ControlsProps {
  month: string; cutoff: TreasuryCutoff; branch: string; thisMonth: string;
  branches: { id: string; name: string }[];
  onChange: (next: Partial<{ month: string; cutoff: string; branch: string }>) => void;
}

/** Month, cut-off and branch: 48px-tall targets, the cut-off as one segmented control. */
const Controls: React.FC<ControlsProps> = ({ month, cutoff, branch, thisMonth, branches, onChange }) => (
  <Card>
    <CardBody className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tc-month" className="text-sm font-semibold text-black dark:text-white">Month</label>
        <input id="tc-month" type="month" value={month} min="2022-01" max={thisMonth} required
          onChange={(e) => e.target.value && onChange({ month: e.target.value })}
          className="min-h-12 rounded-lg border border-stroke bg-transparent px-3 tabular-nums dark:border-strokedark dark:bg-boxdark" />
      </div>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold text-black dark:text-white">Cut-off</legend>
        <div className="inline-flex rounded-lg border border-stroke p-1 dark:border-strokedark">
          {CUTOFFS.map((c) => (
            <button key={c.value} type="button" aria-pressed={cutoff === c.value} onClick={() => onChange({ cutoff: c.value })}
              className={`min-h-12 flex-1 whitespace-nowrap rounded-md px-4 text-sm font-semibold tabular-nums transition-colors ${cutoff === c.value
                ? 'bg-primary text-white shadow-sm' : 'text-body hover:bg-whiten dark:text-bodydark dark:hover:bg-meta-4'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5 sm:ml-auto">
        <label htmlFor="tc-branch" className="text-sm font-semibold text-black dark:text-white">Branch</label>
        <select id="tc-branch" value={branch} onChange={(e) => onChange({ branch: e.target.value })}
          className="min-h-12 rounded-lg border border-stroke bg-transparent px-3 dark:border-strokedark dark:bg-boxdark sm:min-w-64">
          <option value="">All my branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
    </CardBody>
  </Card>
);

/** Hairlines between the four bridge figures: stacked on phones, 2×2 from sm, one row from lg. */
const BRIDGE_RULES = [
  '',
  'border-t sm:border-t-0 sm:border-l',
  'border-t lg:border-t-0 lg:border-l',
  'border-t sm:border-l lg:border-t-0',
];

/** The report's equation, large: Beginning + Deposits − Disbursements = Ending. */
const Bridge: React.FC<{ report: TreasuryCashReport; branchName: string }> = ({ report, branchName }) => {
  const t = report.total;
  const moved = report.lines.reduce((c, l) => c + Math.max(0, Math.round(Number(l.transfers) * 100)), 0) / 100;
  const steps = [
    { label: `Beginning · ${dayLabel(report.start_date)}`, amount: t.beginning, op: '', balance: true },
    { label: 'Deposits', amount: t.deposits, op: '+' },
    { label: 'Disbursements', amount: t.disbursements, op: '−' },
    // A period still running is "so far", never a date that hasn't come.
    { label: report.end_date > manilaToday() ? 'Ending · so far' : `Ending · ${dayLabel(report.end_date)}`, amount: t.ending, op: '=', strong: true, balance: true },
  ];
  return (
    <Card as="section" aria-labelledby="tc-title" className="overflow-hidden">
      <div className="border-b border-stroke bg-whiten px-4 py-4 sm:px-6 dark:border-strokedark dark:bg-meta-4">
        <h2 id="tc-title" className="font-display text-2xl font-semibold text-black dark:text-white">Cash for {report.label}</h2>
        <p className="mt-1 text-sm text-body dark:text-bodydark">
          {branchName} · cash on hand, cash in bank and petty cash, from the books
        </p>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.label} className={`relative px-4 py-4 sm:px-6 sm:py-5 ${BRIDGE_RULES[i]} border-stroke dark:border-strokedark ${s.strong ? 'bg-primary/5' : ''}`}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark">{s.label}</dt>
            <dd className={`mt-1.5 whitespace-nowrap font-display tabular-nums leading-tight ${s.balance && Number(s.amount) < 0 ? 'text-danger' : 'text-black dark:text-white'} ${s.strong ? 'text-2xl font-semibold sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
              {s.op && <span aria-hidden="true" className="mr-1.5 text-[#8A6312]">{s.op}</span>}
              {money(s.amount)}
            </dd>
          </div>
        ))}
      </dl>
      {moved > 0 && (
        <p className="border-t border-stroke px-4 py-3 text-sm text-body sm:px-6 dark:border-strokedark dark:text-bodydark">
          {money(moved.toFixed(2))} also moved between cash accounts (deposits of cash on hand, bank-to-bank). Those appear under Transfers below and net to zero in the total.
        </p>
      )}
    </Card>
  );
};

/** One row per cash account, grouped, with a subtotal per group and the grand total. */
const Statement: React.FC<{ report: TreasuryCashReport }> = ({ report }) => {
  const groups = GROUPS.map((g, gi) => ({
    title: g.title,
    lines: report.lines.filter((l) => GROUPS.findIndex((x) => x.test.test(l.account_name)) === gi),
  })).filter((g) => g.lines.length > 0);
  return (
    <Card>
      <div className={rt.wrap}>
        <table className={rt.table}>
          <caption className="sr-only">Cash by account for {report.label}</caption>
          <thead className={rt.thead}>
            <tr>
              <th scope="col" className={rt.thPin}>Account</th>
              {COLUMNS.map((c) => <th key={c.key} scope="col" className={rt.thNum}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr><td colSpan={6} className={rt.emptyRow}>No cash balance or movement for this branch and period.</td></tr>
            )}
            {groups.map((g) => <Group key={g.title} title={g.title} lines={g.lines} single={groups.length === 1} />)}
            {groups.length > 0 && <AmountRow label="Total cash" amounts={report.total} className={rt.grand} />}
          </tbody>
        </table>
      </div>
      <p className="border-t border-stroke px-4 py-3 text-xs leading-relaxed text-body sm:px-6 dark:border-strokedark dark:text-bodydark">
        Every voucher not deleted or cancelled, by journal date, as the General Ledger and Balance Sheet count it.
        Ending = Beginning + Deposits − Disbursements + Transfers. A branch shows the cash its own vouchers moved,
        so a bank account several branches use shows that branch&apos;s share.
      </p>
    </Card>
  );
};

const Group: React.FC<{ title: string; lines: TreasuryCashLine[]; single: boolean }> = ({ title, lines, single }) => (
  <>
    <tr><th scope="rowgroup" colSpan={6} className={`${rt.groupPin} text-left`}>{title}</th></tr>
    {lines.map((l) => (
      <tr key={l.number} className="hover:bg-whiten dark:hover:bg-meta-4">
        <th scope="row" className={`${rt.tdPin} min-w-[11rem] text-left font-normal`} style={indent(1)}>
          <span className="block">{l.account_name}</span>
          <span className="block text-xs text-body tabular-nums dark:text-bodydark">{l.number}</span>
        </th>
        {COLUMNS.map((c) => <AmountCell key={c.key} column={c.key} value={l[c.key]} />)}
      </tr>
    ))}
    {!single && lines.length > 1 && <AmountRow label={`Total ${title.toLowerCase()}`} amounts={sumOf(lines)} className={rt.subtotal} />}
  </>
);

const AmountRow: React.FC<{ label: string; amounts: TreasuryCashAmounts; className: string }> = ({ label, amounts, className }) => (
  <tr className={className}>
    <th scope="row" className={`${rt.tdPin} text-left`}>{label}</th>
    {COLUMNS.map((c) => <AmountCell key={c.key} column={c.key} value={amounts[c.key]} />)}
  </tr>
);

/** Zero movements fade to a dash; a negative balance reads in the danger colour, with its minus sign. */
const AmountCell: React.FC<{ column: keyof TreasuryCashAmounts; value: string }> = ({ column, value }) => {
  if (isZero(value) && column !== 'beginning' && column !== 'ending') {
    return <td className={`${rt.tdNum} text-body/60 dark:text-bodydark/60`}><span aria-label="none">—</span></td>;
  }
  const negativeBalance = (column === 'beginning' || column === 'ending') && Number(value) < 0;
  return (
    <td className={`${rt.tdNum} whitespace-nowrap ${negativeBalance ? 'text-danger' : ''}`}>
      {column === 'transfers' ? signed(value) : money(value)}
    </td>
  );
};

export default TreasuryCashHome;
