'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Eye, XCircle } from 'react-feather';
import StatusPill from '../../../components/StatusPill';
import { useImport, type ImportBatchPayload, type OpeningBalancePreview as Preview } from '@/hooks/useImport';
import { formatCurrency } from '@/utils/formatCurrency';
import { addAmounts, validateDoubleEntry } from '@/utils/financial';

/**
 * What posting an imported legacy loan book to the general ledger WOULD write.
 *
 * READ ONLY, AND THAT IS THE WHOLE POINT. The single most important thing a
 * reader must leave this screen knowing is that nothing has been written — so
 * that statement is the loudest element on the page, not a footnote. There is
 * deliberately no post button: the account the equity credit lands in is a
 * chart-of-accounts policy decision and nothing may be written until the
 * accountant has settled it.
 *
 * Laid out in the order an accountant actually checks:
 *   1. has anything been written?          (no)
 *   2. does it balance?                     (debit vs credit, proved)
 *   3. what is being refused, and why?
 *   4. the entries themselves
 *
 * Money is never arithmetic'd in JS floats. The balance proof goes through
 * validateDoubleEntry (decimal.js) and every figure is displayed via
 * formatCurrency — NOT formatToTwoDecimalPlaces, which is an input normaliser
 * and would render these without separators.
 *
 * Palette note: this project's tailwind config sets `red` and `gray` to single
 * hex strings, so every numbered shade of those two is a dead class that
 * renders unstyled and `next build` says nothing. Hence danger / success /
 * amber-* / gray-2 / meta-4 throughout, never red-500 or gray-100.
 */
export default function OpeningBalancePreview({ batchRef }: { batchRef: string }) {
  const { openingBalance, busy, error } = useImport();
  const [batch, setBatch] = useState<ImportBatchPayload | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [contra, setContra] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    openingBalance(batchRef)
      .then((res) => {
        if (cancelled || !res) return;
        setBatch(res.batch);
        setPreview(res.preview);
        setContra(res.contra_account);
      })
      .catch(() => {
        /* surfaced through `error` from the hook */
      });
    return () => {
      cancelled = true;
    };
  }, [batchRef, openingBalance]);

  if (error) {
    return (
      <div className="rounded-sm border border-danger/40 bg-danger/10 px-7 py-4 text-sm text-danger">
        {error}
      </div>
    );
  }

  if (busy || !batch || !preview) {
    return (
      <div className="rounded-sm border border-stroke bg-white px-7 py-10 text-center text-sm text-body shadow-default dark:border-strokedark dark:bg-boxdark dark:text-bodydark">
        Working out what this book still owes…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Keyframes />

      <Section delay={0}>
        <HeaderCard batch={batch} />
      </Section>

      <Section delay={1}>
        <PreviewNotice count={preview.entries.length} contra={contra} />
      </Section>

      <Section delay={2}>
        <BalanceProof totals={preview.totals} />
      </Section>

      {preview.problems.length > 0 && (
        <Section delay={3}>
          <Problems problems={preview.problems} />
        </Section>
      )}

      {preview.skipped.length > 0 && (
        <Section delay={4}>
          <Refusals skipped={preview.skipped} />
        </Section>
      )}

      <Section delay={5}>
        <EntryLedger entries={preview.entries} />
      </Section>
    </div>
  );
}

/**
 * One subtle upward fade per SECTION — six of them, not per row. A per-row
 * stagger on a 300-loan ledger would delay the figures someone came to check,
 * which is the opposite of helpful on a review screen.
 */
function Keyframes() {
  return (
    <style>{`
      @keyframes fuerte-rise {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        .fuerte-rise { animation: none !important; }
      }
    `}</style>
  );
}

function Section({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <div
      className="fuerte-rise"
      style={{
        animation: 'fuerte-rise 380ms cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${delay * 55}ms`,
      }}
    >
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {children}
    </div>
  );
}

function CardHead({ title, note }: { title: string; note?: string }) {
  return (
    <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
      <h3 className="font-medium text-black dark:text-white">{title}</h3>
      {note && <p className="mt-1 text-xs text-body dark:text-bodydark">{note}</p>}
    </div>
  );
}

function HeaderCard({ batch }: { batch: ImportBatchPayload }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke px-7 py-4 dark:border-strokedark">
        <div>
          <h3 className="font-medium text-black dark:text-white">{batch.original_filename}</h3>
          <p className="mt-1 text-xs text-body dark:text-bodydark">
            {batch.batch_ref} · {batch.committed_count} loans imported
            {batch.committed_at ? ` · posted ${batch.committed_at}` : ''}
          </p>
        </div>
        <StatusPill status={batch.status} />
      </div>
    </Card>
  );
}

/**
 * The loudest thing on the page, on purpose. Every other preview surface in
 * this app sits in front of a button that commits; this one does not, and a
 * reader who assumes otherwise would think the books had already moved.
 */
function PreviewNotice({ count, contra }: { count: number; contra: string }) {
  return (
    <div className="rounded-sm border-l-4 border-primary bg-primary/5 px-7 py-5">
      <div className="flex items-start gap-3">
        <Eye size={18} className="mt-0.5 shrink-0 text-primary" />
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-black dark:text-white">
            Nothing has been posted. This is a preview only.
          </p>
          <p className="max-w-3xl text-sm text-body dark:text-bodydark">
            {count === 0
              ? 'No entry could be stated for this batch — see the refusals below.'
              : `These are the ${count === 1 ? 'entry' : `${count} entries`} that posting this book
                 would create — one journal voucher per loan, stating what is still owed today.`}{' '}
            No journal entry exists, no voucher number has been used, and no account balance has
            changed.
          </p>
          <p className="text-xs text-body dark:text-bodydark">
            The equity credit is shown against account <span className="font-mono">{contra}</span>,
            which is still awaiting sign-off from whoever owns the chart of accounts.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * An accountant's first instinct is to check that the entry balances, so the
 * two totals are put face to face rather than buried in a list of figures.
 * The arithmetic goes through decimal.js — never a JS float.
 */
function BalanceProof({ totals }: { totals: Preview['totals'] }) {
  const { isValid, difference } = validateDoubleEntry(
    [totals.notes_receivable],
    [totals.unearned_interest, totals.equity],
  );

  return (
    <Card>
      <CardHead
        title="Does it balance?"
        note={`${totals.loans} ${totals.loans === 1 ? 'loan' : 'loans'} stated`}
      />
      <div className="px-7 py-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <Side
            label="Total debit"
            sub="Notes Receivable"
            amount={totals.notes_receivable}
            tone="text-black dark:text-white"
          />

          <div
            className={`justify-self-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              isValid ? 'bg-green-100 text-green-700' : 'bg-danger/10 text-danger'
            }`}
          >
            {isValid ? 'equal' : 'out by ' + formatCurrency(difference.toFixed(2))}
          </div>

          {/* The credit side is shown as its TOTAL first, with the two legs
              beneath it. Listing 7,100 beside a debit of 35,000 made the
              reader take the "equal" pill on trust; showing 35,000 = 35,000
              lets them see it. Summed with decimal.js, never a float. */}
          <div className="sm:text-right">
            <Side
              label="Total credit"
              sub=""
              amount={addAmounts(totals.unearned_interest, totals.equity).toFixed(2)}
              tone="text-black dark:text-white"
              align="sm:text-right"
            />
            <dl className="mt-2 space-y-1 border-t border-stroke pt-2 text-xs dark:border-strokedark">
              <div className="flex justify-between gap-4 sm:justify-end">
                <dt className="text-body dark:text-bodydark">Unearned Interest</dt>
                <dd className="tabular-nums text-black dark:text-white sm:min-w-[7.5rem]">
                  {formatCurrency(totals.unearned_interest)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 sm:justify-end">
                <dt className="text-body dark:text-bodydark">Retained Earnings, beginning</dt>
                <dd className="tabular-nums text-black dark:text-white sm:min-w-[7.5rem]">
                  {formatCurrency(totals.equity)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 border-t border-stroke pt-4 text-sm dark:border-strokedark">
          {isValid ? (
            <>
              <CheckCircle size={15} className="mt-0.5 shrink-0 text-green-600" />
              <span className="text-body dark:text-bodydark">
                Every voucher balances to the centavo. Debit equals credit.
              </span>
            </>
          ) : (
            <>
              <XCircle size={15} className="mt-0.5 shrink-0 text-danger" />
              <span className="text-danger">
                These entries do not balance. Do not post this — report it, because a balanced
                entry is guaranteed by the calculation and an unbalanced one means a defect.
              </span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function Side({
  label,
  sub,
  amount,
  tone,
  align = '',
}: {
  label: string;
  sub: string;
  amount: string;
  tone: string;
  align?: string;
}) {
  return (
    <div className={align}>
      {label && (
        <p className="text-xs font-medium uppercase tracking-wide text-body dark:text-bodydark">
          {label}
        </p>
      )}
      <p className={`mt-0.5 text-xl font-semibold tabular-nums ${tone}`}>
        {formatCurrency(amount)}
      </p>
      <p className="text-xs text-body dark:text-bodydark">{sub}</p>
    </div>
  );
}

function Problems({ problems }: { problems: string[] }) {
  return (
    <Card>
      <CardHead
        title="Resolve these first"
        note="Each of these has to be settled by a person before this book could be posted."
      />
      <div className="space-y-2 px-7 py-5">
        {problems.map((p, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/10 dark:text-amber-400"
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{p}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Grouped by REASON, not listed per loan. A real legacy batch refuses in bulk
 * for a handful of reasons, and three hundred loan references tell a reader
 * nothing that "212 × marked closed but still owing" does not.
 */
function Refusals({ skipped }: { skipped: Preview['skipped'] }) {
  const groups = new Map<string, string[]>();
  for (const s of skipped) {
    const key = generalise(s.reason);
    groups.set(key, [...(groups.get(key) ?? []), s.loan_ref]);
  }

  return (
    <Card>
      <CardHead
        title={`${skipped.length} ${skipped.length === 1 ? 'loan' : 'loans'} not included`}
        note="Refused rather than guessed at — a stated figure that might be wrong is worse than none."
      />
      <div className="space-y-3 px-7 py-5">
        {/* Array.from, not a spread: this project's tsconfig target predates
            es2015 iteration, so [...map.entries()] fails the build. */}
        {Array.from(groups.entries()).map(([reason, refs]) => (
          <div key={reason} className="flex items-start gap-2 text-sm">
            <XCircle size={15} className="mt-0.5 shrink-0 text-danger" />
            <div>
              <p className="text-black dark:text-white">
                <strong className="tabular-nums">{refs.length}×</strong> {reason}
              </p>
              <p className="mt-0.5 font-mono text-xs text-body dark:text-bodydark">
                {refs.slice(0, 12).join(', ')}
                {refs.length > 12 ? ` … and ${refs.length - 12} more` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Reasons carry the loan's own figures ("still shows 8,000.00 owing"), which
 * would make every row its own group. Strip the amounts so like groups with
 * like, and keep the sentence readable.
 */
function generalise(reason: string): string {
  return reason.replace(/\d[\d,]*\.\d{2}/g, 'an amount').trim();
}

/**
 * The entries themselves, grouped per loan and tied together by a left border,
 * because a paper journal voucher reads that way — and because "one voucher per
 * loan" is the single most consequential fact about this design.
 */
function EntryLedger({ entries }: { entries: Preview['entries'] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardHead title="Entries" />
        <div className="px-7 py-10 text-center text-sm text-body dark:text-bodydark">
          No entry could be stated for this batch.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHead
        title={`${entries.length} journal ${entries.length === 1 ? 'voucher' : 'vouchers'}`}
        note="One per loan, dated at the cutover. Each states what that loan still owes today."
      />
      <div className="overflow-x-auto px-7 py-5">
        <div className="min-w-[640px] space-y-4">
          {entries.map((e) => (
            <div key={e.loan_ref} className="border-l-2 border-stroke pl-4 dark:border-strokedark">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className="font-mono text-sm font-medium text-black dark:text-white">
                  {e.loan_ref}
                </span>
                <span className="text-sm text-black dark:text-white">{e.borrower}</span>
                <span className="text-xs text-body dark:text-bodydark">
                  {e.branch}
                  {e.released_date ? ` · released ${e.released_date}` : ''}
                </span>
              </div>

              <table className="mt-2 w-full table-auto text-sm">
                <thead>
                  <tr className="bg-gray-2 text-left dark:bg-meta-4">
                    <th className="px-3 py-2 font-medium text-black dark:text-white">Account</th>
                    <th className="px-3 py-2 text-right font-medium text-black dark:text-white">
                      Debit
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-black dark:text-white">
                      Credit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {e.lines.map((l, i) => (
                    <tr
                      key={`${l.account}-${i}`}
                      className={i % 2 === 0 ? 'bg-white dark:bg-boxdark' : 'bg-gray-2 dark:bg-meta-4'}
                    >
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs text-body dark:text-bodydark">
                          {l.account}
                        </span>
                        <span className="ml-2 text-black dark:text-white">{l.name}</span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-black dark:text-white">
                        {isZero(l.debit) ? '—' : formatCurrency(l.debit)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-black dark:text-white">
                        {isZero(l.credit) ? '—' : formatCurrency(l.credit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * A dash reads better than ₱0.00 on the unused side of a journal line, and it
 * lets the eye follow the amounts down the column. String comparison, because
 * these are BCMath strings and must not be parsed into a float to be tested.
 */
function isZero(amount: string): boolean {
  return /^-?0*\.?0*$/.test(amount.trim());
}
