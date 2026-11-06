"use client";

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from '@/utils/notify';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import {
  ATM_FUNDS_REQUEST, ATM_REFUNDS, ATM_REFUND_PROOF, NOTIFY_OWNERS_FUNDS, RELEASE_ATM_REFUND,
  AtmFundsRow, AtmRefund, AtmResult,
} from '@/graphql/AtmCollectionQueries';
import { amt, gql, paperDate, positive, readAsDataUri, useGql } from '../lib';
import '../atm.css';

type View = 'refunds' | 'fp' | 'funds';
const VIEWS: { id: View; label: string }[] = [
  { id: 'refunds', label: 'Refunds to release' },
  { id: 'fp', label: 'Fully paid (ATM pull-out)' },
  { id: 'funds', label: 'Release funds request' },
];

const methodLabel = (r: AtmRefund) => r.refund_method === 'ACCOUNT' ? `Account ${r.refund_account_no ?? ''}` : r.refund_method === 'CASH' ? 'Cash refund' : 'TOF fr. Treasury';

/** Marketing and Treasury: refunds owed to clients (released with proof), FP notices, funds request. */
const RefundsHome: React.FC = () => {
  const params = useSearchParams();
  const view = (VIEWS.find((v) => v.id === params.get('view'))?.id ?? 'refunds') as View;

  return (
    <div className="atm-root flex flex-col gap-5">
      <nav aria-label="Refund views" className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <Link key={v.id} href={`/atm-collections/refunds?view=${v.id}`} aria-current={view === v.id ? 'page' : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${view === v.id ? 'bg-primary text-white' : 'border border-stroke text-black dark:border-strokedark dark:text-white'}`}>
            {v.label}
          </Link>
        ))}
      </nav>
      {view === 'funds' ? <FundsRequest /> : <RefundList fullyPaid={view === 'fp'} />}
    </div>
  );
};

const RefundList: React.FC<{ fullyPaid: boolean }> = ({ fullyPaid }) => {
  const { data, error, loading, reload } = useGql<{ atmRefunds: AtmRefund[] }>(ATM_REFUNDS, { status: null });
  const rows = (data?.atmRefunds ?? []).filter((r) => (fullyPaid ? r.fully_paid : positive(r.refund)));
  const pending = rows.filter((r) => r.refund_status === 'pending');
  const done = rows.filter((r) => r.refund_status !== 'pending');

  if (error) return <p role="alert" className="text-danger">{error}</p>;
  return (
    <section className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
      <h2 className="font-display text-lg text-black dark:text-white">{fullyPaid ? 'Fully paid clients' : 'Refunds owed to clients'}</h2>
      <p className="mb-4 text-sm text-body">
        {fullyPaid
          ? 'These clients are fully paid (FP). Marketing may request the ATM pull-out and the client may pick up the ATM.'
          : 'Release each refund to the client and attach proof (a photo of the signed receipt, or a PDF). Releasing books Refund Payable against cash.'}
      </p>
      {loading && !data && <p className="text-body">Loading…</p>}
      {!fullyPaid && pending.length > 0 && (
        <p className="mb-3 text-sm font-semibold">{pending.length} to release · ₱<span className="atm-num">{amt(sumStrings(pending.map((p) => p.refund)))}</span></p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-body">
            <tr><th className="py-2 pr-4">Client</th><th className="pr-4">Branch · list</th><th className="pr-4 text-right">Refund</th><th className="pr-4">Goes by</th><th className="pr-4">Status</th><th /></tr>
          </thead>
          <tbody>
            {[...pending, ...done].map((r) => <RefundRow key={r.id} r={r} onChanged={reload} />)}
            {rows.length === 0 && !loading && <tr><td colSpan={6} className="py-6 text-center text-body">{fullyPaid ? 'No fully paid clients yet.' : 'No refunds owed.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const RefundRow: React.FC<{ r: AtmRefund; onChanged: () => void }> = ({ r, onChanged }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const inputId = `proof-${r.id}`;

  const release = async (file: File | undefined) => {
    if (!file) return;
    const ok = await showConfirmationModal('Release this refund?', `₱${amt(r.refund)} to ${r.borrower_name}, with ${file.name} as proof.`, 'Release refund');
    if (!ok) { if (fileRef.current) fileRef.current.value = ''; return; }
    setBusy(true);
    try {
      const proof = await readAsDataUri(file);
      const { releaseAtmRefund: res } = await gql<{ releaseAtmRefund: AtmResult }>(RELEASE_ATM_REFUND, { line_id: r.id, proof });
      res.status ? toast.success(res.message) : toast.error(res.message);
      if (res.status) onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Not released.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const viewProof = async () => {
    try {
      const { atmRefundProof } = await gql<{ atmRefundProof: string | null }>(ATM_REFUND_PROOF, { id: r.id });
      if (!atmRefundProof) { toast.error('No proof on file.'); return; }
      // Open it as a Blob URL: nothing from the server is ever written into a page as HTML.
      const blob = await (await fetch(atmRefundProof)).blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Proof not loaded.'); }
  };

  return (
    <tr className="border-t border-stroke dark:border-strokedark">
      <td className="py-2.5 pr-4 font-semibold uppercase">{r.borrower_name}{r.fully_paid && <span className="atm-red ml-2 font-bold">FP</span>}</td>
      <td className="pr-4">{r.branch_sub_name} · <Link className="text-primary hover:underline" href={`/atm-collections/${r.batch_id}`}>Batch {r.batch_no}</Link><div className="text-xs text-body">{paperDate(r.collection_date)}</div></td>
      <td className="atm-num pr-4 text-right font-semibold">{positive(r.refund) ? amt(r.refund) : '-'}</td>
      <td className={`pr-4 text-xs font-semibold ${r.refund_method === 'TOF' ? 'atm-teal' : 'atm-red'}`}>{positive(r.refund) ? methodLabel(r) : ''}</td>
      <td className="pr-4">
        {r.refund_status === 'review'
          ? <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger" title="Part of this posting was reversed in Payment Posting">Accounting review</span>
          : r.refund_status === 'released'
          ? <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">Received by client</span>
          : r.refund_status === 'pending'
            ? <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-[#8A6312]">To release</span>
            : <span className="text-xs text-body">No refund</span>}
      </td>
      <td className="text-right">
        {r.refund_status === 'pending' && (
          <>
            <label htmlFor={inputId} className={`inline-block cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white ${busy ? 'pointer-events-none opacity-60' : ''}`}>
              {busy ? 'Releasing…' : 'Release with proof'}
            </label>
            <input id={inputId} ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only"
              onChange={(e) => release(e.target.files?.[0])} />
          </>
        )}
        {r.has_proof && <button type="button" onClick={viewProof} className="text-xs font-semibold text-primary hover:underline">View proof</button>}
      </td>
    </tr>
  );
};

const FundsRequest: React.FC = () => {
  const { data, error, loading } = useGql<{ atmFundsRequest: AtmFundsRow[] }>(ATM_FUNDS_REQUEST, {});
  const rows = data?.atmFundsRequest ?? [];

  const notify = async (row: AtmFundsRow) => {
    const ok = await showConfirmationModal('Notify the owners?', `Tell the owners you are releasing ₱${amt(row.total)} to ${row.branch_sub_name}.`, 'Notify owners');
    if (!ok) return;
    try {
      const { notifyOwnersOfFundsRelease: res } = await gql<{ notifyOwnersOfFundsRelease: AtmResult }>(NOTIFY_OWNERS_FUNDS, { branch_sub_id: row.branch_sub_id, amount: row.total });
      res.status ? toast.success(res.message) : toast.error(res.message);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Not sent.'); }
  };

  if (error) return <p role="alert" className="text-danger">{error}</p>;
  return (
    <section className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
      <h2 className="font-display text-lg text-black dark:text-white">Release funds request</h2>
      <p className="mb-4 text-sm text-body">How much each branch needs: refunds still to hand out, plus loans waiting for release. A Red branch&apos;s loan releases are on hold and not counted.</p>
      {loading && !data && <p className="text-body">Loading…</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-body">
            <tr><th className="py-2 pr-4 text-left">Branch</th><th className="pr-4 text-right">Refunds</th><th className="pr-4 text-right">Loan releases</th><th className="pr-4 text-right">To withdraw</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.branch_sub_id} className="border-t border-stroke dark:border-strokedark">
                <td className="py-2.5 pr-4 font-semibold">{r.branch_sub_name}
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${r.can_release ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {r.can_release ? 'Green' : 'Red'}{r.rate_percent ? ` ${r.rate_percent}%` : ''}
                  </span>
                </td>
                <td className="atm-num pr-4 text-right">{amt(r.refunds)}</td>
                <td className="atm-num pr-4 text-right">{r.can_release ? <>{amt(r.loan_releases)} <span className="text-xs text-body">({r.loan_release_count})</span></> : <span className="atm-red text-xs font-semibold">On hold ({amt(r.loan_releases)})</span>}</td>
                <td className="atm-num pr-4 text-right text-base font-bold">{amt(r.total)}</td>
                <td className="text-right"><button type="button" onClick={() => notify(r)} className="text-xs font-semibold text-primary hover:underline">Notify owners</button></td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr className="border-t-2 border-black font-bold dark:border-white">
                <td className="py-2.5">Total</td>
                <td className="atm-num text-right pr-4">{amt(sumStrings(rows.map((r) => r.refunds)))}</td>
                <td />
                <td className="atm-num pr-4 text-right text-base">{amt(sumStrings(rows.map((r) => r.total)))}</td>
                <td />
              </tr>
            )}
            {rows.length === 0 && !loading && <tr><td colSpan={5} className="py-6 text-center text-body">No branch has posted a collection list yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
};

/** Exact sum of two-place decimal strings (cents as BigInt), so totals never go through a float. */
function sumStrings(values: string[]): string {
  const hundred = BigInt(100);
  const cents = values.reduce((t, v) => {
    const [w, c = ''] = v.split('.');
    return t + BigInt(w || '0') * hundred + BigInt((c + '00').slice(0, 2));
  }, BigInt(0));
  return `${cents / hundred}.${String(cents % hundred).padStart(2, '0')}`;
}

export default RefundsHome;
