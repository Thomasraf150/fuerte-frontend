"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from '@/utils/notify';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ATM_SHEET, POST_ATM_BATCH, SIGN_ATM_BATCH, AtmResult, AtmSheet } from '@/graphql/AtmCollectionQueries';
import { amt, gql, useGql } from '../lib';
import PaperSheet from './PaperSheet';
import SwipePanel from './SwipePanel';
import { RateMeter, RateStamp } from './RateBits';
import '../atm.css';

interface PostResult { status: boolean; message: string; posted: number; failed: { borrower: string; message: string }[] }

/** One collection list: the paper sheet, the branch's rate, swipe entry, sign-offs and posting. */
const CollectionSheet: React.FC<{ id: string }> = ({ id }) => {
  const { data, error, loading, reload } = useGql<{ atmCollectionSheet: AtmSheet | null }>(ATM_SHEET, { id });
  const [selected, setSelected] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const sheet = data?.atmCollectionSheet ?? null;
  useDocumentTitle(sheet ? `Batch ${sheet.batch.batch_no}` : null, sheet?.batch.branch_sub_name);

  if (error) return <p role="alert" className="text-danger">{error}</p>;
  if (!sheet) return <p className="text-body">{loading ? 'Loading the collection list…' : 'Collection list not found.'}</p>;

  const { batch, rate } = sheet;
  const draft = batch.status === 'draft';
  const row = sheet.rows.find((r) => r.borrower_id === selected) ?? null;
  const swiped = sheet.rows.filter((r) => r.swipes.length > 0 && !r.posted).length;

  const sign = async (as: 'checked' | 'noted') => {
    try {
      const { signAtmCollectionBatch: res } = await gql<{ signAtmCollectionBatch: AtmResult }>(SIGN_ATM_BATCH, { batch_id: id, as });
      res.status ? toast.success(res.message) : toast.error(res.message);
      if (res.status) reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Not signed.'); }
  };

  const post = async () => {
    const ok = await showConfirmationModal('Post this collection list?',
      `${swiped} borrower(s) will be posted to their loans and to accounting. Refunds go to Refund Payable and Marketing is notified. Corrections afterwards are reversals in Payment Posting.`,
      'Post collection list');
    if (!ok) return;
    setPosting(true);
    try {
      const { postAtmCollectionBatch: res } = await gql<{ postAtmCollectionBatch: PostResult }>(POST_ATM_BATCH, { batch_id: id });
      if (res.status) toast.success(res.message);
      else toast.error([res.message, ...res.failed.map((f) => `${f.borrower}: ${f.message}`)].join('\n'));
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Posting failed.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="atm-root flex flex-col gap-5">
      <div className="atm-noprint flex flex-wrap items-center justify-between gap-3">
        <Link href="/atm-collections" className="text-sm font-semibold text-primary hover:underline">← All collection lists</Link>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="rounded-lg border border-stroke px-4 py-2 text-sm font-semibold dark:border-strokedark">Print</button>
          {!batch.checked_by_name && <button type="button" onClick={() => sign('checked')} className="rounded-lg border border-stroke px-4 py-2 text-sm font-semibold dark:border-strokedark">Mark checked (Accounting)</button>}
          {!batch.noted_by_name && <button type="button" onClick={() => sign('noted')} className="rounded-lg border border-stroke px-4 py-2 text-sm font-semibold dark:border-strokedark">Mark noted (MD)</button>}
          {draft && (
            <button type="button" onClick={post} disabled={posting || swiped === 0}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-opacity-90 disabled:opacity-60"
              title={swiped === 0 ? 'Enter at least one swipe first' : undefined}>
              {posting ? 'Posting…' : `Post collection list (${swiped})`}
            </button>
          )}
        </div>
      </div>

      <section className="atm-noprint flex flex-wrap items-center gap-6 rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark" aria-label="Collection rate">
        <RateStamp green={rate.is_green} />
        <div className="min-w-64 flex-1">
          <p className="text-sm text-body">{draft ? 'If posted as entered now' : 'Collected this cut-off'}</p>
          <p className="font-display text-3xl text-black dark:text-white">{rate.percent}% <span className="text-base text-body">of ₱{amt(rate.due)} amort due</span></p>
          <RateMeter percent={rate.percent} threshold={rate.threshold} green={rate.is_green} />
        </div>
        <p className="max-w-xs text-sm">
          {rate.is_green ? 'Green: this branch may release loans.' : <>Red: no loan release. <strong className="atm-num">₱{amt(rate.amount_to_green)}</strong> more must be collected to turn Green.</>}
        </p>
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <PaperSheet sheet={sheet} selectedId={selected} onSelect={setSelected} />
        <div className="2xl:sticky 2xl:top-24 2xl:self-start">
          {row
            ? <SwipePanel batchId={id} listBranchSubId={String(batch.branch_sub_id)} row={row} editable={draft} onChanged={reload} />
            : <p className="atm-noprint rounded-xl border border-dashed border-stroke p-5 text-sm text-body">Choose a borrower on the list to enter their ATM swipes.</p>}
        </div>
      </div>
    </div>
  );
};

export default CollectionSheet;
