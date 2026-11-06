"use client";

import React from 'react';
import type { AtmRow, AtmSheet } from '@/graphql/AtmCollectionQueries';
import { amt, paperDate, positive } from '../lib';
import { PenTick } from './RateBits';

interface Props {
  sheet: AtmSheet;
  selectedId: string | null;
  onSelect: (borrowerId: string) => void;
}

/** One amount per swipe, stacked as on the paper (Calubag: 10,018.00 over 2,418.00). */
const Stack: React.FC<{ values: (string | null)[]; className?: string }> = ({ values, className = '' }) => (
  <div className={`flex flex-col items-end ${className}`}>
    {values.map((v, i) => <span key={i} className="atm-num">{v === null || v === '' ? ' ' : v}</span>)}
  </div>
);

const account = (row: AtmRow): React.ReactNode => {
  if (!positive(row.refund)) return null;
  if (row.refund_method === 'ACCOUNT') return <span className="atm-red atm-num font-semibold">{row.refund_account_no}</span>;
  if (row.refund_method === 'CASH') return <span className="atm-red font-semibold">CASH REFUND</span>;
  return <span className="atm-teal font-semibold">TOF FR. TREASURY</span>;
};

/**
 * The collection list drawn like the office's paper/Excel sheet (header, ruled columns, totals with
 * a double rule, Prepared / Checked / Noted by). Each row is a borrower; click or press Enter on a
 * row to enter swipes for them.
 */
const PaperSheet: React.FC<Props> = ({ sheet, selectedId, onSelect }) => {
  const { batch, rows, totals } = sheet;
  const swipeCol = (row: AtmRow, pick: (s: AtmRow['swipes'][number]) => string | null) =>
    row.swipes.length ? row.swipes.map((s) => (pick(s) === null ? null : amt(pick(s), { blankZero: true }))) : [''];

  return (
    <div className="atm-paper rounded-md p-5 sm:p-8">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="leading-tight">
          <p className="atm-sheet-title text-lg font-bold">Fuerte Lending Corporation</p>
          <p className="atm-sheet-title font-bold">Collection List</p>
          <p className="atm-teal font-bold uppercase tracking-wide">{batch.branch_sub_name}</p>
          <p className="font-bold">{paperDate(batch.collection_date)}</p>
        </div>
        <p className="atm-sheet-title text-lg font-bold">Batch: {batch.batch_no}</p>
      </header>
      <p className="text-sm font-semibold">Below is the schedule of deductions for payroll date {batch.cutoff_label.toUpperCase()}.</p>
      <p className="mb-4 text-sm font-semibold">NOTE: USING BANCNET GPRS PAYMENT SYSTEM.</p>

      <div className="overflow-x-auto">
        <table className="atm-table min-w-[1100px] text-sm" aria-label={`Collection list, batch ${batch.batch_no}`}>
          <thead>
            <tr>
              <th rowSpan={2} className="text-left">Name</th>
              <th rowSpan={2}>ATM Collection</th>
              <th rowSpan={2}>Semi Amort.</th>
              <th rowSpan={2}>UA/SP</th>
              <th rowSpan={2}>UA Payment</th>
              <th rowSpan={2}>Penalty</th>
              <th colSpan={2}>Bank Charge</th>
              <th rowSpan={2}>A/P or Refund</th>
              <th rowSpan={2}>Remarks</th>
              <th rowSpan={2}>Account Number</th>
              <th rowSpan={2}>Balance</th>
            </tr>
            <tr><th>GPRS</th><th>POS</th></tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.borrower_id} tabIndex={0} aria-selected={selectedId === row.borrower_id}
                onClick={() => onSelect(row.borrower_id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(row.borrower_id); } }}>
                <td className="min-w-52">
                  <span className="atm-num mr-2 text-body">{i + 1}</span>
                  <span className="font-semibold uppercase">{row.borrower_name}</span>
                  {row.status === 'not_swiped' && !row.posted && <span className="ml-2 text-xs text-body">not swiped</span>}
                  {row.status === 'nothing_due' && <span className="atm-red ml-2 text-xs font-semibold">owes nothing now: remove the swipe</span>}
                </td>
                <td className="text-right"><Stack values={swipeCol(row, (s) => s.amount)} />{row.posted && positive(row.atm_collection) && <PenTick />}</td>
                <td className="text-right atm-num">{amt(row.amort_due, { blankZero: true })}</td>
                <td className="text-right atm-num">{positive(row.ua_sp) ? amt(row.ua_sp, { parens: true }) : ''}</td>
                <td className="text-right atm-num">{positive(row.ua_payment) ? amt(row.ua_payment) : ''}</td>
                <td className="text-right atm-num">{positive(row.penalty) ? amt(row.penalty) : ''}</td>
                <td className="text-right"><Stack values={row.posted ? [amt(row.gprs_charge, { blankZero: true })] : swipeCol(row, (s) => s.gprs_charge)} /></td>
                <td className="text-right"><Stack values={row.posted ? [amt(row.pos_charge, { blankZero: true })] : swipeCol(row, (s) => s.pos_charge)} /></td>
                <td className="text-right font-semibold">
                  <Stack values={row.posted || !row.swipes.length ? [positive(row.refund) ? amt(row.refund) : (row.swipes.length ? '-' : '')] : swipeCol(row, (s) => s.refund)} />
                </td>
                <td className="text-center">
                  {row.fully_paid && <span className="atm-red font-bold" title="Fully paid">FP</span>}
                  {row.swipes.filter((s) => s.cross_group).map((s) => (
                    <span key={s.id} className="atm-ap-mark ml-1" title={`Swipe ${s.seq} was made at ${s.swiped_at_name}: recorded as Accounts Payable between the groups`}>
                      A/P · {s.swiped_at_group_code}
                    </span>
                  ))}
                </td>
                <td className="text-center text-xs">{account(row)}</td>
                <td className="text-right"><Stack values={row.swipes.map((s) => amt(s.balance_inquiry))} className="text-body" /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={12} className="py-8 text-center text-body">No borrower of this branch has an amortization due this cut-off.</td></tr>
            )}
            <tr className="atm-total">
              <td className="uppercase">Total</td>
              <td className="text-right atm-num">{amt(totals.atm_collection)}</td>
              <td className="text-right atm-num">{amt(totals.amort_due)}</td>
              <td className="text-right atm-num">{positive(totals.ua_sp) ? amt(totals.ua_sp, { parens: true }) : '-'}</td>
              <td className="text-right atm-num">{amt(totals.ua_payment, { blankZero: true })}</td>
              <td className="text-right atm-num">{amt(totals.penalty, { blankZero: true })}</td>
              <td className="text-right atm-num">{amt(totals.gprs_charge)}</td>
              <td className="text-right atm-num">{amt(totals.pos_charge)}</td>
              <td className="text-right atm-num">{amt(totals.refund)}</td>
              <td colSpan={3} />
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm font-semibold">NOTE: SWIPED IN RCBC POS.</p>
      <footer className="mt-10 grid gap-8 text-sm sm:grid-cols-3">
        <Signature label="Prepared by" name={batch.prepared_by_name} role="" />
        <Signature label="Checked by" name={batch.checked_by_name} role="Accounting" />
        <Signature label="Noted by" name={batch.noted_by_name} role="Managing Director/President" />
      </footer>
    </div>
  );
};

const Signature: React.FC<{ label: string; name: string | null; role: string }> = ({ label, name, role }) => (
  <div>
    <p className="font-semibold">{label}:</p>
    <p className="mt-6 min-h-6 border-b border-[var(--atm-ink)] pb-0.5 font-display text-base">{name ?? ' '}</p>
    <p className="mt-1 uppercase tracking-wide">{role || ' '}</p>
  </div>
);

export default PaperSheet;
