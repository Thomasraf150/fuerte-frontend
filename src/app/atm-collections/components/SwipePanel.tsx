"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from '@/utils/notify';
import {
  ADD_ATM_SWIPE, ATM_SWIPE_LOCATIONS, REMOVE_ATM_SWIPE, SET_ATM_REFUND_METHOD,
  AtmResult, AtmRow, AtmSwipeLocation,
} from '@/graphql/AtmCollectionQueries';
import { amt, cleanAmount, gql, positive } from '../lib';

interface Props {
  batchId: string;
  /** The list's own sub-branch: where a swipe is assumed to be made unless someone says otherwise. */
  listBranchSubId: string;
  row: AtmRow;
  editable: boolean;
  onChanged: () => void;
}

/** Sub-branches change rarely: fetched once per page load, shared by every borrower's panel. */
let locationsCache: Promise<AtmSwipeLocation[]> | null = null;
const loadLocations = () => {
  locationsCache ??= gql<{ atmSwipeLocations: AtmSwipeLocation[] }>(ATM_SWIPE_LOCATIONS)
    .then((d) => d.atmSwipeLocations)
    .catch((e) => { locationsCache = null; throw e; });
  return locationsCache;
};

const groupLabel = (code: string | null) => (code ? `Group ${code}` : 'No group');

/** A swipe made in another group: that group holds the cash, so the books carry an A/P and an A/R. */
const CrossGroupMark: React.FC<{ code: string | null }> = ({ code }) => (
  <span className="inline-flex items-center rounded-full bg-[#2c6e86]/10 px-2 py-0.5 text-xs font-semibold text-[#2c6e86]" title="Swiped in another group: that group books the cash and an Inter-group Payable">A/P · {code ?? '—'}</span>
);

/**
 * Swipe entry for one borrower: what they owe this cut-off, each swipe with how it splits, the
 * refund method, and the form to add a swipe. Everything shown is what posting will book.
 */
const SwipePanel: React.FC<Props> = ({ batchId, listBranchSubId, row, editable, onChanged }) => {
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('');
  const [swipedAt, setSwipedAt] = useState(listBranchSubId);
  const [locations, setLocations] = useState<AtmSwipeLocation[]>([]);
  const [method, setMethod] = useState(row.refund_method);
  const [accountNo, setAccountNo] = useState(row.refund_account_no ?? '');
  const [busy, setBusy] = useState(false);
  const canSwipe = editable && !row.posted;

  useEffect(() => {
    if (!canSwipe) return;
    let live = true;
    loadLocations().then((l) => live && setLocations(l)).catch(() => live && toast.error('Could not load the branch list for "Swiped at".'));
    return () => { live = false; };
  }, [canSwipe]);

  const groups = useMemo(() => {
    const byGroup = new Map<string, AtmSwipeLocation[]>();
    locations.forEach((l) => byGroup.set(groupLabel(l.group_code), [...(byGroup.get(groupLabel(l.group_code)) ?? []), l]));
    return Array.from(byGroup.entries());
  }, [locations]);
  const ownGroup = locations.find((l) => l.id === listBranchSubId)?.group_code ?? null;
  const chosen = locations.find((l) => l.id === swipedAt);
  const chosenIsCross = !!chosen && chosen.id !== listBranchSubId && chosen.group_code !== ownGroup;

  useEffect(() => {
    setSwipedAt(listBranchSubId);
    setMethod(row.refund_method);
    setAccountNo(row.refund_account_no ?? '');
    setAmount('');
    setBalance('');
  }, [row.borrower_id, row.refund_method, row.refund_account_no, listBranchSubId]);

  const run = async (mutation: string, vars: Record<string, unknown>, field: string) => {
    setBusy(true);
    try {
      const data = await gql<Record<string, AtmResult>>(mutation, vars);
      const res = data[field];
      if (!res.status) { toast.error(res.message); return false; }
      onChanged();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Not saved.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addSwipe = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanAmount(amount);
    const cleanBal = balance.trim() === '' ? null : cleanAmount(balance);
    if (!clean || clean === '0' || Number(clean) <= 0) { toast.error('Enter the amount swiped, e.g. 10018.00.'); return; }
    if (balance.trim() !== '' && !cleanBal) { toast.error('Enter the balance inquiry in pesos, or leave it empty.'); return; }
    if (await run(ADD_ATM_SWIPE, { batch_id: batchId, borrower_id: row.borrower_id, amount: clean, balance_inquiry: cleanBal, swiped_at_branch_sub_id: swipedAt || null }, 'addAtmSwipe')) {
      setAmount('');
      setBalance('');
      setSwipedAt(listBranchSubId); // the next swipe starts back at this branch: a cross-group swipe is always a choice
    }
  };

  const saveMethod = () => run(SET_ATM_REFUND_METHOD, { batch_id: batchId, borrower_id: row.borrower_id, method, account_no: method === 'ACCOUNT' ? accountNo : null }, 'setAtmRefundMethod')
    .then((ok) => ok && toast.success('Refund method saved.'));

  return (
    <aside className="atm-noprint rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark" aria-label={`Swipes for ${row.borrower_name}`}>
      <h3 className="font-display text-lg text-black dark:text-white">{row.borrower_name}</h3>
      {row.loan_refs.length > 0 && <p className="text-xs text-body">{row.loan_refs.join(' · ')}</p>}

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <dt className="text-body">Semi amort due</dt><dd className="atm-num text-right">{amt(row.amort_due)}</dd>
        {positive(row.ua_open) && (<><dt className="text-body">Open UA</dt><dd className="atm-num text-right">{amt(row.ua_open)}</dd></>)}
        {positive(row.penalty_open) && (<><dt className="text-body">Penalty (4% per cut-off)</dt><dd className="atm-num text-right">{amt(row.penalty_open)}</dd></>)}
      </dl>

      <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-body">Swipes</h4>
      {row.swipes.length === 0 && <p className="text-sm text-body">None yet.</p>}
      <ol className="mt-1 flex flex-col gap-2">
        {row.swipes.map((s) => (
          <li key={s.id} className="rounded-lg border border-stroke p-2.5 text-sm dark:border-strokedark">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Swipe {s.seq}: <span className="atm-num">₱{amt(s.amount)}</span></span>
              {canSwipe && (
                <button type="button" disabled={busy} onClick={() => run(REMOVE_ATM_SWIPE, { batch_id: batchId, swipe_id: s.id }, 'removeAtmSwipe')}
                  className="text-xs font-semibold text-danger hover:underline" aria-label={`Remove swipe ${s.seq}`}>Remove</button>
              )}
            </div>
            {s.swiped_at_name && (
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-body">
                at {s.swiped_at_name}{s.swiped_at_group_code ? ` · ${s.swiped_at_group_code}` : ''}
                {s.cross_group && <CrossGroupMark code={s.swiped_at_group_code} />}
              </p>
            )}
            {s.refund !== null && (
              <p className="mt-1 text-xs text-body atm-num">
                charges {amt(s.pos_charge)} + {amt(s.gprs_charge)} · amort {amt(s.amort)}
                {positive(s.ua_payment) && <> · UA {amt(s.ua_payment)}</>}
                {positive(s.penalty) && <> · penalty {amt(s.penalty)}</>}
                {' '}· <strong className="atm-red">refund {amt(s.refund)}</strong>
              </p>
            )}
          </li>
        ))}
      </ol>

      {canSwipe && (
        <form onSubmit={addSwipe} className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="atm-swipe-amount" className="mb-1 block text-sm font-semibold">Amount swiped</label>
            <input id="atm-swipe-amount" inputMode="decimal" autoComplete="off" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="10,018.00" className="atm-num w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-right dark:border-strokedark" />
          </div>
          <div>
            <label htmlFor="atm-swipe-balance" className="mb-1 block text-sm font-semibold">Balance inquiry</label>
            <input id="atm-swipe-balance" inputMode="decimal" autoComplete="off" value={balance} onChange={(e) => setBalance(e.target.value)}
              placeholder="optional" className="atm-num w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-right dark:border-strokedark" />
          </div>
          <div className="col-span-2">
            <label htmlFor="atm-swipe-at" className="mb-1 block text-sm font-semibold">Swiped at</label>
            <select id="atm-swipe-at" value={swipedAt} onChange={(e) => setSwipedAt(e.target.value)} aria-describedby="atm-swipe-at-note"
              className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 dark:border-strokedark dark:bg-boxdark">
              {locations.length === 0 && <option value={listBranchSubId}>This branch</option>}
              {groups.map(([label, subs]) => (
                <optgroup key={label} label={label}>
                  {subs.map((l) => <option key={l.id} value={l.id}>{l.name}{l.id === listBranchSubId ? ' (this list)' : ''}</option>)}
                </optgroup>
              ))}
            </select>
            <p id="atm-swipe-at-note" className={`mt-1.5 text-xs ${chosenIsCross ? 'atm-cross-note' : 'text-body'}`} aria-live="polite">
              {chosenIsCross
                ? <>Another group. {chosen?.name} ({chosen?.group_code}) books the cash and an A/P due to this group; this branch books an A/R in place of cash.</>
                : 'The branch whose POS the ATM was swiped on.'}
            </p>
          </div>
          <button type="submit" disabled={busy} className="col-span-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-opacity-90 disabled:opacity-60">
            {busy ? 'Saving…' : 'Add swipe'}
          </button>
        </form>
      )}
      {row.posted && <p className="mt-4 rounded-lg bg-success/10 p-3 text-sm text-success">Posted ({row.journal_refs.join(', ')}).{row.intergroup_refs.length > 0 && <> Receiving group: {row.intergroup_refs.join(', ')}.</>} To correct it, reverse the payment in Payment Posting.</p>}

      <fieldset className="mt-5 border-t border-stroke pt-4 dark:border-strokedark" disabled={busy || row.refund_status === 'released'}>
        <legend className="text-xs font-semibold uppercase tracking-wide text-body">Refund goes by</legend>
        <div className="mt-2 flex flex-col gap-1.5 text-sm">
          {([['TOF', 'TOF from Treasury'], ['ACCOUNT', 'Transfer to account number'], ['CASH', 'Cash refund']] as const).map(([v, label]) => (
            <label key={v} className="flex items-center gap-2">
              <input type="radio" name={`refund-method-${row.borrower_id}`} value={v} checked={method === v} onChange={() => setMethod(v)} />{label}
            </label>
          ))}
          {method === 'ACCOUNT' && (
            <>
              <label htmlFor="atm-refund-account" className="sr-only">Account number</label>
              <input id="atm-refund-account" inputMode="numeric" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} placeholder="Account number"
                className="atm-num rounded-lg border border-stroke bg-transparent px-3 py-1.5 dark:border-strokedark" />
            </>
          )}
        </div>
        <button type="button" onClick={saveMethod} className="mt-3 rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/5">Save refund method</button>
      </fieldset>
    </aside>
  );
};

export default SwipePanel;
