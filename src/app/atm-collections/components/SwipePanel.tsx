"use client";

import React, { useEffect, useState } from 'react';
import { toast } from '@/utils/notify';
import {
  ADD_ATM_SWIPE, REMOVE_ATM_SWIPE, SET_ATM_REFUND_METHOD,
  AtmResult, AtmRow,
} from '@/graphql/AtmCollectionQueries';
import { amt, cleanAmount, gql, positive } from '../lib';

interface Props {
  batchId: string;
  row: AtmRow;
  editable: boolean;
  onChanged: () => void;
}

/**
 * Swipe entry for one borrower: what they owe this cut-off, each swipe with how it splits, the
 * refund method, and the form to add a swipe. Everything shown is what posting will book.
 */
const SwipePanel: React.FC<Props> = ({ batchId, row, editable, onChanged }) => {
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('');
  const [method, setMethod] = useState(row.refund_method);
  const [accountNo, setAccountNo] = useState(row.refund_account_no ?? '');
  const [busy, setBusy] = useState(false);
  const canSwipe = editable && !row.posted;

  useEffect(() => {
    setMethod(row.refund_method);
    setAccountNo(row.refund_account_no ?? '');
    setAmount('');
    setBalance('');
  }, [row.borrower_id, row.refund_method, row.refund_account_no]);

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
    if (await run(ADD_ATM_SWIPE, { batch_id: batchId, borrower_id: row.borrower_id, amount: clean, balance_inquiry: cleanBal }, 'addAtmSwipe')) {
      setAmount('');
      setBalance('');
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
          <button type="submit" disabled={busy} className="col-span-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-opacity-90 disabled:opacity-60">
            {busy ? 'Saving…' : 'Add swipe'}
          </button>
        </form>
      )}
      {row.posted && <p className="mt-4 rounded-lg bg-success/10 p-3 text-sm text-success">Posted ({row.journal_refs.join(', ')}). To correct it, reverse the payment in Payment Posting.</p>}

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
