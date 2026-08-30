'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, RotateCcw, Download } from 'react-feather';
import { useImport, ImportBatchPayload, ImportRowPayload } from '@/hooks/useImport';
import { useAuthStore } from '@/store';
import { formatCurrency } from '@/utils/formatCurrency';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import StatusPill from '../../components/StatusPill';
import { formatNumberComma } from '@/utils/helper';


/**
 * The review screen: validate -> counts -> error groups -> typed confirm ->
 * commit -> persistent result. Also hosts the reversal action for a committed
 * batch.
 *
 * Design rules carried over from the import investigation:
 *  - The result is NEVER only a toast (ToastContainer autocloses in 3s).
 *  - Errors are grouped by message, not listed row-by-row.
 *  - Commit gate: the counts summary sits beside a checkbox the operator ticks;
 *    the server independently re-checks the counts (stale-tab protection).
 *  - Cancel uses the system-wide SweetAlert confirmation, like every screen.
 */
export default function ImportReview({ batchRef }: { batchRef: string }) {
  const { validate, show, commit, reverse, busy, error, setError } = useImport();
  const [batch, setBatch] = useState<ImportBatchPayload | null>(null);
  const [rows, setRows] = useState<ImportRowPayload[]>([]);
  // field => column label, supplied by the import type's handler.
  const [reviewFields, setReviewFields] = useState<Record<string, string> | null>(null);
  const [checked, setChecked] = useState(false);
  // Elapsed-seconds counter for the long operations (commit/reverse write
  // journal entries then recompute balances — tens of seconds for big files).
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (busy !== 'commit' && busy !== 'reverse') return;
    const t0 = Date.now();
    setElapsed(0);
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, [busy]);

  const load = useCallback(async () => {
    const res = await show(batchRef);
    if (res) {
      setBatch(res.batch);
      setRows(res.rows);
      setReviewFields(res.review_fields ?? null);
    }
  }, [batchRef, show]);

  // On first open: if the batch is still 'uploaded', run validation, then load.
  // load() runs whatever validation returned — on failure the batch comes back
  // as 'failed' carrying summary.fatal, which the page renders. Skipping it
  // left a checked-looking page with no message and nothing to retry.
  useEffect(() => {
    (async () => {
      const res = await show(batchRef);
      if (!res) return;
      if (res.batch.status === 'uploaded') {
        await validate(batchRef);
      }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchRef]);

  // A batch someone else is validating/posting settles on its own; without a
  // poll, reloading mid-run pins the page on that pill until a manual refresh.
  useEffect(() => {
    if (batch?.status !== 'validating' && batch?.status !== 'committing') return;
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [batch?.status, load]);

  const doCommit = useCallback(async () => {
    if (!batch) return;
    // The human gate is the checkbox beside the on-screen summary. The counts
    // are still sent so the server can refuse if the batch changed server-side
    // between this page loading and the click (stale-tab protection).
    const res = await commit(batchRef, batch.ok_count, batch.total_amount);
    // Reload either way: a refusal means our counts are stale, and retrying
    // with the same stale numbers would fail identically forever.
    await load();
    if (!res) setChecked(false);
  }, [batch, batchRef, commit, load]);

  /**
   * Authenticated fetch -> blob -> anchor, same as the import dialog: a bare
   * <a download> cannot carry the Bearer token this endpoint needs.
   */
  const getReceipt = useCallback(async () => {
    setError(null);
    try {
      const token = useAuthStore.getState().GET_AUTH_TOKEN();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/imports/${batchRef}/receipt`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(`Could not build the ID list (${res.status})`);

      const disposition = res.headers.get('Content-Disposition') ?? '';
      const named = /filename="?([^";]+)"?/.exec(disposition)?.[1];
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = named ?? `Fuerte_Borrower_IDs_${batchRef}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: any) {
      setError(e?.message ?? 'Could not build the ID list');
    }
  }, [batchRef, setError]);

  const doReverse = useCallback(async () => {
    // The system-wide SweetAlert confirmation, same as every other screen.
    const confirmed = await showConfirmationModal(
      'Cancel this posting?',
      'This removes every payment and journal entry this posting created and recomputes balances. The journal numbers it used stay used.',
      'Yes, cancel it',
    );
    if (!confirmed) return;
    const res = await reverse(batchRef);
    if (res) await load();
  }, [batchRef, reverse, load]);

  if (!batch) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-7 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="text-body dark:text-bodydark">
          {busy ? 'Checking the file…' : error ?? 'Loading…'}
        </p>
      </div>
    );
  }

  const groups = batch.summary?.error_groups ?? [];
  const warningRows = rows.filter(
    (r) => r.outcome === 'ok' && (r.messages ?? []).some((m) => m[0] === 'warning'),
  );
  const canCommit = batch.status === 'validated' && batch.ok_count > 0;
  const summary = batch.summary as
    | { will_create?: number; will_update?: number; unchanged?: number }
    | null;
  // Collections carries a peso total to restate; borrowers and master data do
  // not, and showing them "Total to post: P0.00" is noise at best.
  const hasMoney = Number(batch.total_amount) > 0;
  // Falls back to the collections shape so an older batch, or a handler that
  // sends nothing, renders exactly as it did before.
  const columns = Object.entries(
    reviewFields ?? {
      loan_ref: 'Loan',
      amount: 'Amount',
      remaining_before: 'Remaining before',
      interest: 'Interest',
    },
  );
  const confirmOk = checked;

  return (
    <div className="space-y-4">
      {/* Page-level errors. Previously the only error block lived inside the
          'validated' branch, so a failed cancel — a money operation — reported
          nothing at all. */}
      {error && (
        <div className="rounded-sm border border-danger/40 bg-danger/10 px-7 py-4 text-sm text-danger">
          {error}
        </div>
      )}

      {/* header card */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-7 py-4 dark:border-strokedark flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-medium text-black dark:text-white">{batch.original_filename}</h3>
            <p className="text-xs text-body dark:text-bodydark mt-1">
              {batch.batch_ref} · uploaded {batch.created_at}
            </p>
          </div>
          <StatusPill status={batch.status} />
        </div>

        {batch.summary?.fatal && (
          <div className="m-7 rounded border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {batch.summary.fatal}
          </div>
        )}

        {/* error groups */}
        {groups.length > 0 && (
          <div className="px-7 py-5 border-b border-stroke dark:border-strokedark">
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-body dark:text-bodydark">
              Why rows were rejected
            </h4>
            <ul className="space-y-2">
              {groups.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-black dark:text-white">
                  <XCircle size={15} className="mt-0.5 shrink-0 text-danger" />
                  <span>
                    <strong>{g.count}×</strong> {g.message}
                    <span className="text-body dark:text-bodydark">
                      {' — rows '}{g.rows.join(', ')}
                      {/* the server caps the row list at 25; say so rather than
                          silently showing a short list beside a bigger count */}
                      {g.count > g.rows.length && ` and ${g.count - g.rows.length} more`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* warnings on rows that WILL post */}
        {warningRows.length > 0 && (
          <div className="px-7 py-5 border-b border-stroke dark:border-strokedark">
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-body dark:text-bodydark">
              Will post, but check these
            </h4>
            <ul className="space-y-2">
              {warningRows.map((r) => (
                <li key={r.sheet_row} className="flex items-start gap-2 text-sm text-black dark:text-white">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                  <span>
                    Row {r.sheet_row} · {r.loan_ref} ·{' '}
                    {(r.messages ?? [])
                      .filter((m) => m[0] === 'warning')
                      .map((m) => m[2])
                      .join('; ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* the rows themselves */}
        <div className="px-7 py-5 overflow-x-auto">
          {/* Columns come from the handler, not from here. They used to be
              hardcoded to collections (Loan / Amount / Remaining / Interest),
              so a borrowers batch rendered five dashes per row. The server
              already sends review_fields; this just honours it. */}
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-body dark:text-bodydark border-b border-stroke dark:border-strokedark">
                <th className="py-2 pr-3">Row</th>
                {columns.map(([field, label]) => (
                  <th key={field} className={`py-2 pr-3 ${isNumeric(field) ? 'text-right' : ''}`}>
                    {label}
                  </th>
                ))}
                <th className="py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.sheet_row} className="border-b border-stroke dark:border-strokedark last:border-0">
                  <td className="py-2 pr-3 tabular-nums">{r.sheet_row}</td>
                  {columns.map(([field]) => {
                    const value = (r as Record<string, unknown>)[field];
                    const blank = value === null || value === undefined || value === '';
                    return (
                      <td
                        key={field}
                        className={`py-2 pr-3 ${isNumeric(field) ? 'text-right tabular-nums' : 'font-mono text-xs'}`}
                      >
                        {blank
                          ? '—'
                          : isNumeric(field)
                            ? formatNumberComma(Number(value))
                            : String(value)}
                      </td>
                    );
                  })}
                  <td className="py-2"><OutcomePill outcome={r.outcome} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* confirm-and-commit card — the summary shows for ANY checked file,
          even one with nothing postable, so the counts always have a home */}
      {batch.status === 'validated' && (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark px-7 py-5 space-y-4">
          <h4 className="text-xs font-medium uppercase tracking-wide text-body dark:text-bodydark">
            Confirm before posting
          </h4>
          {canCommit ? (
            <p className="text-sm text-black dark:text-white max-w-xl">
              {hasMoney
                ? 'Nothing has been posted yet. Check these numbers against the paper collection sheet, then tick the box.'
                : 'Nothing has been saved yet. Check the list above — especially anything marked "Will update" — then tick the box.'}
            </p>
          ) : (
            <p className="text-sm text-black dark:text-white max-w-xl">
              No rows can be posted — every row was rejected. Fix the file and upload it again.
            </p>
          )}
          {/* the summary lives HERE, beside the checkbox — the reader confirms what they just read */}
          <dl className="max-w-md rounded-lg border border-stroke dark:border-strokedark divide-y divide-stroke dark:divide-strokedark text-sm">
            <div className="flex justify-between px-4 py-2.5">
              <dt className="text-body dark:text-bodydark">Rows in file</dt>
              <dd className="tabular-nums text-black dark:text-white">{batch.row_count}</dd>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <dt className="text-body dark:text-bodydark">Ready to post</dt>
              <dd className="tabular-nums font-medium text-green-600">{batch.ok_count}</dd>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <dt className="text-body dark:text-bodydark">Rejected — will not post</dt>
              <dd className={`tabular-nums ${batch.error_count > 0 ? 'font-medium text-danger' : 'text-black dark:text-white'}`}>
                {batch.error_count}
              </dd>
            </div>
            {/* Types that carry no money total (borrowers, master data) would
                otherwise show a meaningless "Total to post: P0.00". */}
            {hasMoney && (
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-body dark:text-bodydark">Total to post</dt>
                <dd className="tabular-nums font-medium text-black dark:text-white">{formatCurrency(batch.total_amount)}</dd>
              </div>
            )}
            {/* Set by types that match against existing records, so the clerk
                can see at a glance how much of the file is genuinely new. */}
            {typeof summary?.will_create === 'number' && (
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-body dark:text-bodydark">New — will be added</dt>
                <dd className="tabular-nums text-black dark:text-white">{summary.will_create}</dd>
              </div>
            )}
            {typeof summary?.will_update === 'number' && (
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-body dark:text-bodydark">Already there — will be updated</dt>
                <dd className="tabular-nums text-black dark:text-white">{summary.will_update}</dd>
              </div>
            )}
            {typeof summary?.unchanged === 'number' && (
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-body dark:text-bodydark">Already there — nothing to change</dt>
                <dd className="tabular-nums text-black dark:text-white">{summary.unchanged}</dd>
              </div>
            )}
          </dl>
          {canCommit && busy === 'commit' && (
            <div className="flex max-w-xl items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4">
              <span
                className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
                aria-hidden
              />
              <div className="text-sm text-black dark:text-white">
                <p className="font-medium">
                  Posting {batch.ok_count} collections…{elapsed > 0 ? ` ${elapsed}s` : ''}
                </p>
                <p className="mt-0.5 text-xs text-body dark:text-bodydark">
                  Writing journal entries and recomputing account balances. Keep this tab open — bigger files can take a minute.
                </p>
              </div>
            </div>
          )}
          {canCommit && busy !== 'commit' && (
            <>
              <label className="flex items-start gap-2 text-sm text-black dark:text-white max-w-xl">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="mt-1"
                />
                {hasMoney
                  ? 'These match the paper collection sheet.'
                  : 'I have checked the list above.'}
              </label>
              {error && (
                <div className="rounded border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
              )}
              <button
                onClick={doCommit}
                disabled={!confirmOk || busy !== null}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={15} />
                {hasMoney
                  ? `Post ${batch.ok_count} collections`
                  : `Import ${batch.ok_count} record${batch.ok_count === 1 ? '' : 's'}`}
              </button>
            </>
          )}
        </div>
      )}

      {/* committed result — persistent, never a toast */}
      {batch.status === 'committed' && (
        <div className="rounded-sm border border-green-600/40 bg-green-50 dark:bg-green-900/10 px-7 py-5 space-y-3">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle size={18} />
            <span className="font-medium">
              {hasMoney
                ? `Posted ${batch.summary?.commit?.committed ?? batch.committed_count} collections`
                : `Imported ${batch.committed_count} record${batch.committed_count === 1 ? '' : 's'}`}
              {batch.summary?.commit?.failed ? ` — ${batch.summary.commit.failed} failed` : ''}
            </span>
          </div>
          <p className="text-sm text-black dark:text-white max-w-xl">
            {hasMoney ? (
              <>
                Journal entries were created and account balances updated
                ({batch.summary?.commit?.accounts_swept ?? '—'} accounts). Committed {batch.committed_at}.
              </>
            ) : (
              <>
                {typeof batch.summary?.commit?.created === 'number' && (
                  <>{batch.summary.commit.created} added, {batch.summary.commit.updated ?? 0} updated. </>
                )}
                Nothing was posted to the ledger. Committed {batch.committed_at}.
              </>
            )}
          </p>

          {/* The borrower ids live nowhere else, and the loans sheet needs them.
              Offered on reversed batches too — the ids of rows this batch merely
              matched are still valid, and losing the file should not mean
              re-uploading to get them back. */}
          {!hasMoney && (
            <button
              onClick={getReceipt}
              disabled={busy !== null}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-green-600/40 bg-white px-5 py-2.5 text-sm text-black transition hover:border-green-600 disabled:opacity-50 dark:bg-boxdark dark:text-white"
            >
              <Download size={14} />
              Download the ID list for the loans sheet
            </button>
          )}
          {batch.summary?.sweep_failed && (
            <div className="flex max-w-xl items-start gap-2 rounded border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/10 dark:text-amber-400">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>Balances could not be recomputed — ask a developer to run the balance sweep.</span>
            </div>
          )}
          {busy === 'reverse' ? (
            <div className="flex max-w-xl items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 px-5 py-4">
              <span
                className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-danger border-t-transparent"
                aria-hidden
              />
              <div className="text-sm text-black dark:text-white">
                <p className="font-medium">Cancelling this posting…{elapsed > 0 ? ` ${elapsed}s` : ''}</p>
                <p className="mt-0.5 text-xs text-body dark:text-bodydark">
                  Removing payments, voiding journal entries and recomputing balances. Keep this tab open.
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={doReverse}
              disabled={busy !== null}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} />
              Cancel this posting
            </button>
          )}
        </div>
      )}

      {batch.status === 'reversed' && (
        <div className="rounded-sm border border-stroke dark:border-strokedark bg-white dark:bg-boxdark px-7 py-5 space-y-3">
          <p className="text-sm text-black dark:text-white">
            This posting was cancelled on {batch.reversed_at}. Its payments were removed from the books and
            account balances re-computed.
          </p>
          {batch.summary?.sweep_failed && (
            <div className="flex max-w-xl items-start gap-2 rounded border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/10 dark:text-amber-400">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>Balances could not be recomputed — ask a developer to run the balance sweep.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


/** Right-align and comma-format the columns that hold money or counts. */
function isNumeric(field: string): boolean {
  return /amount|remaining|interest|net|paid|balance|total/i.test(field);
}

function OutcomePill({ outcome }: { outcome: string }) {
  const map: Record<string, [string, string]> = {
    ok: ['Ready', 'bg-green-100 text-green-700'],
    update: ['Will update', 'bg-amber-100 text-amber-700'],
    unchanged: ['Already there', 'bg-whiten text-body'],
    error: ['Rejected', 'bg-danger/10 text-danger'],
    committed: ['Posted', 'bg-green-100 text-green-700'],
    failed: ['Failed', 'bg-danger/10 text-danger'],
    reversed: ['Cancelled', 'bg-rose-100 text-rose-700'],
  };
  const [label, cls] = map[outcome] ?? [outcome, 'bg-whiten text-body'];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}
