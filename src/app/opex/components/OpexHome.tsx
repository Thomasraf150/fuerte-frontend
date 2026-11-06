"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from '@/utils/notify';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import BranchQueryMutations from '@/graphql/BranchQueryMutation';
import {
  ADD_OPEX_EXPENSE, DECIDE_OPEX_REPLENISHMENT, OPEX_LEDGER, OPEX_PENDING, REQUEST_OPEX_REPLENISHMENT,
  AtmResult, OpexLedger, OpexPending,
} from '@/graphql/AtmCollectionQueries';
import { amt, cleanAmount, gql, useGql } from '@/app/atm-collections/lib';
import '@/app/atm-collections/atm.css';

interface BranchSub { id: string; name: string }

const localToday = (): string => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/** Treasury's OPEX fund per branch: the month's ledger with its carried-over balance, and owner approvals. */
const OpexHome: React.FC = () => {
  const params = useSearchParams();
  const approvals = params.get('view') === 'approvals';
  return (
    <div className="atm-root flex flex-col gap-5">
      <nav aria-label="OPEX views" className="flex gap-2">
        <Link href="/opex" aria-current={!approvals ? 'page' : undefined} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${!approvals ? 'bg-primary text-white' : 'border border-stroke dark:border-strokedark'}`}>Ledger</Link>
        <Link href="/opex?view=approvals" aria-current={approvals ? 'page' : undefined} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${approvals ? 'bg-primary text-white' : 'border border-stroke dark:border-strokedark'}`}>Replenishments to approve</Link>
      </nav>
      {approvals ? <Approvals /> : <Ledger />}
    </div>
  );
};

const Ledger: React.FC = () => {
  const [branches, setBranches] = useState<BranchSub[]>([]);
  const [branchId, setBranchId] = useState('');
  const [month, setMonth] = useState(localToday().slice(0, 7));
  const vars = branchId ? { branch_sub_id: branchId, month } : null;
  const { data, error, loading, reload } = useGql<{ branchOpexLedger: OpexLedger | null; opexCategories: string[] }>(OPEX_LEDGER, vars);

  useEffect(() => {
    gql<{ getMyAccessibleBranchSubs: BranchSub[] }>(BranchQueryMutations.GET_MY_ACCESSIBLE_BRANCH_SUBS_QUERY).then(
      (d) => { const list = d.getMyAccessibleBranchSubs ?? []; setBranches(list); if (list.length) setBranchId(String(list[0].id)); },
      () => setBranches([]),
    );
  }, []);

  const ledger = data?.branchOpexLedger ?? null;
  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="opex-branch" className="mb-1 block text-sm font-semibold">Branch</label>
          <select id="opex-branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} className="min-w-56 rounded-lg border border-stroke bg-white px-3 py-2 dark:border-strokedark dark:bg-boxdark">
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="opex-month" className="mb-1 block text-sm font-semibold">Month</label>
          <input id="opex-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-stroke bg-white px-3 py-2 dark:border-strokedark dark:bg-boxdark" />
        </div>
      </div>
      {error && <p role="alert" className="text-danger">{error}</p>}
      {ledger && (
        <section aria-label="Fund balance" className="atm-paper grid gap-4 rounded-xl p-5 sm:grid-cols-4">
          <Figure label="Beginning (carried over)" value={ledger.beginning} />
          <Figure label="+ Replenished" value={ledger.replenished} />
          <Figure label="− Spent" value={ledger.spent} />
          <Figure label="= Ending balance" value={ledger.ending} strong />
        </section>
      )}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <h2 className="font-display text-lg text-black dark:text-white">OPEX ledger</h2>
          {loading && !data && <p className="text-body">Loading…</p>}
          <div className="overflow-x-auto">
            <table className="atm-table mt-3 text-sm">
              <thead><tr><th className="text-left">Date</th><th className="text-left">Particulars</th><th>In</th><th>Out</th><th>Balance</th></tr></thead>
              <tbody>
                {ledger && (
                  <tr><td /><td className="font-semibold">Beginning balance</td><td /><td /><td className="atm-num text-right font-semibold">{amt(ledger.beginning)}</td></tr>
                )}
                {ledger?.entries.map((e) => (
                  <tr key={e.id} className={e.status !== 'posted' ? 'opacity-60' : ''}>
                    <td className="atm-num">{e.entry_date}</td>
                    <td>{e.particulars}<div className="text-xs text-body">{e.category}{e.source_account ? ` · from account ${e.source_account}` : ''}
                      {e.status === 'pending' && <span className="ml-2 font-semibold text-[#8A6312]">waiting for owner approval</span>}
                      {e.status === 'declined' && <span className="atm-red ml-2 font-semibold">declined</span>}</div></td>
                    <td className="atm-num text-right">{e.type === 'replenishment' ? amt(e.amount) : ''}</td>
                    <td className="atm-num text-right">{e.type === 'expense' ? amt(e.amount) : ''}</td>
                    <td className="atm-num text-right">{amt(e.running_balance)}</td>
                  </tr>
                ))}
                {ledger && (
                  <tr className="atm-total"><td /><td>Ending balance</td><td className="atm-num text-right">{amt(ledger.replenished)}</td><td className="atm-num text-right">{amt(ledger.spent)}</td><td className="atm-num text-right">{amt(ledger.ending)}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        {branchId && <EntryForms branchId={branchId} categories={data?.opexCategories ?? []} onSaved={reload} />}
      </div>
    </>
  );
};

const Figure: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-body">{label}</p>
    <p className={`atm-num font-display ${strong ? 'text-3xl' : 'text-2xl'}`}>₱{amt(value)}</p>
  </div>
);

const EntryForms: React.FC<{ branchId: string; categories: string[]; onSaved: () => void }> = ({ branchId, categories, onSaved }) => {
  const [kind, setKind] = useState<'expense' | 'replenishment'>('expense');
  const [date, setDate] = useState(localToday());
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('A');
  const [particulars, setParticulars] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanAmount(amount);
    if (!clean || Number(clean) <= 0) { toast.error('Enter the amount in pesos, e.g. 2010.00.'); return; }
    if (kind === 'expense' && !category) { toast.error('Choose the expense category.'); return; }
    const input = kind === 'expense'
      ? { branch_sub_id: branchId, entry_date: date, category, particulars: particulars.trim(), amount: clean }
      : { branch_sub_id: branchId, entry_date: date, source_account: source, particulars: particulars.trim(), amount: clean };
    setBusy(true);
    try {
      const field = kind === 'expense' ? 'addOpexExpense' : 'requestOpexReplenishment';
      const data = await gql<Record<string, AtmResult>>(kind === 'expense' ? ADD_OPEX_EXPENSE : REQUEST_OPEX_REPLENISHMENT, { input });
      const res = data[field];
      if (!res.status) { toast.error(res.message); return; }
      toast.success(res.message);
      setParticulars(''); setAmount('');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Not saved.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
      <h2 className="font-display text-lg text-black dark:text-white">Add to the fund</h2>
      <div role="radiogroup" aria-label="Entry type" className="mt-3 flex gap-2 text-sm">
        {(['expense', 'replenishment'] as const).map((k) => (
          <label key={k} className={`cursor-pointer rounded-full px-3 py-1 font-semibold ${kind === k ? 'bg-primary text-white' : 'border border-stroke dark:border-strokedark'}`}>
            <input type="radio" className="sr-only" name="opex-kind" checked={kind === k} onChange={() => setKind(k)} />{k === 'expense' ? 'Expense' : 'Replenishment'}
          </label>
        ))}
      </div>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 text-sm">
        <div>
          <label htmlFor="opex-date" className="mb-1 block font-semibold">Date</label>
          <input id="opex-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 dark:border-strokedark" />
        </div>
        {kind === 'expense' ? (
          <div>
            <label htmlFor="opex-category" className="mb-1 block font-semibold">Category</label>
            <select id="opex-category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 dark:border-strokedark">
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="mt-1 text-xs text-body">Character loans, commission and interest are not OPEX.</p>
          </div>
        ) : (
          <div>
            <label htmlFor="opex-source" className="mb-1 block font-semibold">From main account</label>
            <select id="opex-source" value={source} onChange={(e) => setSource(e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 dark:border-strokedark">
              {['A', 'B', 'C', 'D'].map((a) => <option key={a} value={a}>Account {a}</option>)}
            </select>
            <p className="mt-1 text-xs text-body">The owners approve it before it counts.</p>
          </div>
        )}
        <div>
          <label htmlFor="opex-particulars" className="mb-1 block font-semibold">Particulars</label>
          <input id="opex-particulars" value={particulars} onChange={(e) => setParticulars(e.target.value)} placeholder="e.g. Office rent, November" className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 dark:border-strokedark" />
        </div>
        <div>
          <label htmlFor="opex-amount" className="mb-1 block font-semibold">Amount (₱)</label>
          <input id="opex-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="atm-num w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-right dark:border-strokedark" />
        </div>
        <button type="submit" disabled={busy} className="rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-opacity-90 disabled:opacity-60">
          {busy ? 'Saving…' : kind === 'expense' ? 'Add expense' : 'Request replenishment'}
        </button>
      </form>
    </section>
  );
};

const Approvals: React.FC = () => {
  const { data, error, loading, reload } = useGql<{ opexPendingReplenishments: OpexPending[] }>(OPEX_PENDING, {});
  const decide = async (p: OpexPending, approve: boolean) => {
    const ok = await showConfirmationModal(approve ? 'Approve this replenishment?' : 'Decline this replenishment?',
      `₱${amt(p.amount)} to ${p.branch_sub_name} from account ${p.source_account}: ${p.particulars}`, approve ? 'Approve' : 'Decline');
    if (!ok) return;
    try {
      const { decideOpexReplenishment: res } = await gql<{ decideOpexReplenishment: AtmResult }>(DECIDE_OPEX_REPLENISHMENT, { id: p.id, approve });
      res.status ? toast.success(res.message) : toast.error(res.message);
      if (res.status) reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Not saved.'); }
  };
  if (error) return <p role="alert" className="text-danger">{error}</p>;
  const rows = data?.opexPendingReplenishments ?? [];
  return (
    <section className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
      <h2 className="font-display text-lg text-black dark:text-white">Replenishments to approve</h2>
      <p className="mb-4 text-sm text-body">Only the owners can approve. An approved replenishment adds to the branch&apos;s OPEX fund.</p>
      {loading && !data && <p className="text-body">Loading…</p>}
      <ul className="flex flex-col gap-3">
        {rows.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stroke p-4 dark:border-strokedark">
            <div>
              <p className="font-semibold">{p.branch_sub_name} · <span className="atm-num">₱{amt(p.amount)}</span> from account {p.source_account}</p>
              <p className="text-sm text-body">{p.particulars} · {p.entry_date} · asked by {p.requested_by_name}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => decide(p, true)} className="rounded-lg bg-success px-4 py-1.5 text-sm font-semibold text-white">Approve</button>
              <button type="button" onClick={() => decide(p, false)} className="rounded-lg border border-danger px-4 py-1.5 text-sm font-semibold text-danger">Decline</button>
            </div>
          </li>
        ))}
        {rows.length === 0 && !loading && <li className="text-body">Nothing waiting for approval.</li>}
      </ul>
    </section>
  );
};

export default OpexHome;
