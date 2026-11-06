"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { toast } from '@/utils/notify';
import BranchQueryMutations from '@/graphql/BranchQueryMutation';
import {
  ATM_BATCHES, ATM_BRANCH_STATUSES, CREATE_ATM_BATCH,
  AtmBatch, AtmBranchStatus, AtmResult,
} from '@/graphql/AtmCollectionQueries';
import { amt, gql, paperDate, useGql } from '../lib';
import { RateStatus, RateMeter } from './RateBits';
import '../atm.css';

interface BranchSub { id: string; name: string }

const today = (): string => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/** Collections home: Green/Red per sub-branch, starting a new list, and every list. */
const AtmCollectionsHome: React.FC = () => {
  const router = useRouter();
  const statuses = useGql<{ atmBranchStatuses: AtmBranchStatus[] }>(ATM_BRANCH_STATUSES, {});
  const [page, setPage] = useState(1);
  const batches = useGql<{ atmCollectionBatches: { data: AtmBatch[]; paginatorInfo: { currentPage: number; lastPage: number; total: number } } }>(ATM_BATCHES, { page, first: 15 });
  const [branches, setBranches] = useState<BranchSub[]>([]);
  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    gql<{ getMyAccessibleBranchSubs: BranchSub[] }>(BranchQueryMutations.GET_MY_ACCESSIBLE_BRANCH_SUBS_QUERY).then(
      (d) => { setBranches(d.getMyAccessibleBranchSubs ?? []); if (d.getMyAccessibleBranchSubs?.length === 1) setBranchId(String(d.getMyAccessibleBranchSubs[0].id)); },
      () => setBranches([]),
    );
  }, []);

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) { toast.error('Choose the branch for the collection list.'); return; }
    setSaving(true);
    try {
      const { createAtmCollectionBatch: res } = await gql<{ createAtmCollectionBatch: AtmResult }>(CREATE_ATM_BATCH, { branch_sub_id: branchId, collection_date: date });
      if (!res.status || !res.id) { toast.error(res.message); return; }
      toast.success(res.message);
      router.push(`/atm-collections/${res.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'The list was not created.');
    } finally {
      setSaving(false);
    }
  };

  const list = batches.data?.atmCollectionBatches;

  return (
    <div className="atm-root flex flex-col gap-6">
      <section aria-labelledby="atm-status-heading">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 id="atm-status-heading" className="font-display text-xl text-black dark:text-white">Branch status</h2>
          <p className="text-sm text-body">Green at 80% or more of the cut-off&apos;s amortization collected. Red: no loan releases.</p>
        </div>
        {statuses.error && <p role="alert" className="text-danger">{statuses.error}</p>}
        {!statuses.loading && statuses.data?.atmBranchStatuses.length === 0 && (
          <p className="rounded-lg border border-dashed border-stroke p-6 text-center text-body">No branch has a collection list yet. Start one below.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statuses.data?.atmBranchStatuses.map((s, i) => (
            <BranchCard key={s.branch_sub_id} status={s} delay={i * 60} />
          ))}
        </div>
      </section>

      <section aria-labelledby="atm-new-heading" className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
        <h2 id="atm-new-heading" className="font-display text-lg text-black dark:text-white">New collection list</h2>
        <p className="mb-4 text-sm text-body">The payroll cut-off (1–15 or 16–end of month) comes from the collection date.</p>
        <form onSubmit={createList} className="flex flex-wrap items-end gap-4">
          <div className="min-w-56">
            <label htmlFor="atm-new-branch" className="mb-1 block text-sm font-semibold text-black dark:text-white">Branch</label>
            <select id="atm-new-branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 dark:border-strokedark">
              <option value="">Choose a branch…</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="atm-new-date" className="mb-1 block text-sm font-semibold text-black dark:text-white">Collection date</label>
            <input id="atm-new-date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-stroke bg-transparent px-3 py-2 dark:border-strokedark" />
          </div>
          <button type="submit" disabled={saving}
            className="rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:bg-opacity-90 disabled:opacity-60">
            {saving ? 'Creating…' : 'Create list'}
          </button>
        </form>
      </section>

      <section aria-labelledby="atm-lists-heading" className="rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark">
        <h2 id="atm-lists-heading" className="px-5 pt-5 font-display text-lg text-black dark:text-white">Collection lists</h2>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-body">
              <tr><th className="py-2 pr-4">Batch</th><th className="pr-4">Branch</th><th className="pr-4">Payroll cut-off</th><th className="pr-4">Collection date</th><th className="pr-4">Status</th><th>Prepared by</th></tr>
            </thead>
            <tbody>
              {list?.data.map((b) => (
                <tr key={b.id} className="border-t border-stroke dark:border-strokedark">
                  <td className="py-2 pr-4"><Link className="font-semibold text-primary underline-offset-2 hover:underline" href={`/atm-collections/${b.id}`}>Batch {b.batch_no}</Link></td>
                  <td className="pr-4">{b.branch_sub_name}</td>
                  <td className="pr-4">{b.cutoff_label}</td>
                  <td className="pr-4">{paperDate(b.collection_date)}</td>
                  <td className="pr-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${b.status === 'posted' ? 'bg-success/10 text-success' : 'bg-warning/15 text-[#8A6312]'}`}>
                      {b.status === 'posted' ? 'Posted' : 'Draft'}
                    </span>
                  </td>
                  <td>{b.prepared_by_name}</td>
                </tr>
              ))}
              {list && list.data.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-body">No collection lists yet.</td></tr>}
            </tbody>
          </table>
          {list && list.paginatorInfo.lastPage > 1 && (
            <div className="mt-4 flex items-center justify-end gap-3 text-sm">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border border-stroke px-3 py-1 disabled:opacity-50">Previous</button>
              <span>Page {list.paginatorInfo.currentPage} of {list.paginatorInfo.lastPage}</span>
              <button type="button" disabled={page >= list.paginatorInfo.lastPage} onClick={() => setPage(page + 1)} className="rounded border border-stroke px-3 py-1 disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const BranchCard: React.FC<{ status: AtmBranchStatus; delay: number }> = ({ status, delay }) => {
  const rate = status.rate;
  return (
    <article className="atm-card relative overflow-hidden rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark"
      style={{ animationDelay: `${delay}ms` }}>
      <h3 className="font-display text-lg text-black dark:text-white">{status.branch_sub_name}</h3>
      <p className="text-xs uppercase tracking-wide text-body">{rate ? `Batch ${rate.batch_no} · cut-off from ${paperDate(rate.cutoff_start)}` : 'No posted list yet'}</p>
      {rate ? (
        <>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className={`font-display text-4xl ${rate.is_green ? 'text-success' : 'text-danger'}`}>{rate.percent}%</p>
            <RateStatus green={rate.is_green} size="sm" />
          </div>
          <RateMeter percent={rate.percent} threshold={rate.threshold} green={rate.is_green} />
          <p className="mt-3 text-sm text-black dark:text-white">
            {rate.is_green
              ? 'Loan releases allowed.'
              : <>No loan release. <strong className="atm-num">₱{amt(rate.amount_to_green)}</strong> more must be collected to turn Green.</>}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-1 text-sm">
            <dt className="text-body">Amort due</dt><dd className="atm-num text-right">₱{amt(rate.due)}</dd>
            <dt className="text-body">Collected</dt><dd className="atm-num text-right">₱{amt(rate.collected)}</dd>
            {status.monthly && (<><dt className="text-body">Month {status.monthly.month}</dt><dd className="atm-num text-right">{status.monthly.percent}% <span className="text-xs text-body">(report)</span></dd></>)}
          </dl>
        </>
      ) : <p className="mt-4 text-sm text-body">Releases are not gated until this branch posts its first list.</p>}
      {status.latest_batch_id && (
        <Link href={`/atm-collections/${status.latest_batch_id}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          Open Batch {status.latest_batch_no} ({status.latest_status === 'posted' ? 'posted' : 'draft'}) →
        </Link>
      )}
    </article>
  );
};

export default AtmCollectionsHome;
