'use client';

/**
 * In-office Loan Calculator — quote a loan while the borrower is at the counter.
 *
 * Nothing here creates a borrower, a loan, or a schedule. The pricing call is
 * `processALoan(process_type: "Compute")`, whose only database access is a
 * single SELECT of the loan product.
 *
 * Two ways in:
 *   • Saved product — pick from the catalogue (543 live products).
 *   • Manual entry  — type the rates for a product the office has not set up
 *     yet. The SERVER still prices it (`manual_product` makes the resolver
 *     synthesise an unsaved LoanProducts), so both modes share one engine.
 *
 * Compute runs on an explicit button press, not per keystroke — the borrower
 * form's `handleCompTblDecimal` fires a full network round-trip on every
 * keypress, which is not a pattern to copy onto a page whose whole purpose is
 * re-quoting.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import AsyncReactSelect from '@/components/ReactSelect/AsyncReactSelect';
import { todayLocalISO } from '@/utils/helper';
import {
  SEMI_MONTHLY_PRESETS,
  DAY_OF_MONTH_OPTIONS,
  THRICE_MONTHLY_PRESET,
  WEEKDAY_LABELS,
} from '@/utils/effectivityDateUtils';
import {
  CADENCE_OPTIONS,
  EMPTY_MANUAL_PRODUCT,
  buildSchedule,
  generateDueDates,
  sanitizeAmount,
  validateManualProduct,
} from '@/utils/loanQuote';
import type { Cadence, ComputeResponse, ManualProduct } from '@/utils/loanQuote';
import type { SelectOption } from '@/utils/DataTypes';
import useLoanQuote from '@/hooks/useLoanQuote';
import ManualProductFields from './ManualProductFields';
import QuotePanel from './QuotePanel';

const FIELD_CLASS =
  'w-full rounded-sm border border-stroke bg-transparent px-4 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

const LABEL_CLASS = 'mb-2 block text-sm font-medium text-black dark:text-white';

type Mode = 'product' | 'manual';

/**
 * What the displayed quote was computed from.
 *
 * Only the two things the Compute response does NOT carry back: a human label
 * and base_deduction. Terms and add-on terms are read off the response itself,
 * so the schedule works identically for a catalogue product and a manual card.
 */
interface QuotedContext {
  label: string;
  baseDeduction: number;
}

const LoanCalculator: React.FC = () => {
  const {
    products,
    productsTruncated,
    loadingProducts,
    computing,
    loadProducts,
    searchProducts,
    computeQuote,
    abandonInFlightQuote,
  } = useLoanQuote();

  const [mode, setMode] = useState<Mode>('product');
  const [selected, setSelected] = useState<SelectOption | null>(null);
  const [manual, setManual] = useState<ManualProduct>(EMPTY_MANUAL_PRODUCT);
  const [amount, setAmount] = useState('');
  const [cadence, setCadence] = useState<Cadence>('once_a_month');
  const [dayOfMonth, setDayOfMonth] = useState<number>(15);
  const [cutoffIdx, setCutoffIdx] = useState(1); // default 15/30
  const [weekday, setWeekday] = useState(5); // Friday
  const [startDate, setStartDate] = useState(todayLocalISO());
  const [comp, setComp] = useState<ComputeResponse | null>(null);
  const [quoted, setQuoted] = useState<QuotedContext | null>(null);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const product = useMemo(
    () => products.find((p) => p.id === selected?.value) ?? null,
    [products, selected],
  );

  /** Any edit invalidates the shown quote — never let stale figures linger. */
  const invalidate = useCallback(() => {
    // Retire any Compute still on the wire too, or its response would repaint a
    // printable quote for inputs that have already changed.
    abandonInFlightQuote();
    setComp(null);
    setQuoted(null);
  }, [abandonInFlightQuote]);

  const switchMode = (next: Mode) => {
    setMode(next);
    invalidate();
  };

  const schedule = useMemo(() => {
    if (!comp) return [];
    // Terms come from the response, so this is identical in both modes.
    // Add-on months are repaid too, so they extend the date count — the same
    // fold the release screens apply.
    const termMonths = Number(comp.terms ?? 0) + Number(comp.addon_terms ?? 0);
    if (!Number.isFinite(termMonths) || termMonths < 1) return [];

    const dates = generateDueDates(termMonths, {
      cadence,
      refDate: new Date(`${startDate}T00:00:00`),
      dayOfMonth,
      day1: SEMI_MONTHLY_PRESETS[cutoffIdx].day1,
      day2: SEMI_MONTHLY_PRESETS[cutoffIdx].day2,
      thriceDays: [
        THRICE_MONTHLY_PRESET.day1,
        THRICE_MONTHLY_PRESET.day2,
        THRICE_MONTHLY_PRESET.day3,
      ],
      weekday,
    });
    return buildSchedule(dates, comp);
  }, [comp, cadence, startDate, dayOfMonth, cutoffIdx, weekday]);

  const cadenceLabel = useMemo(() => {
    const base = CADENCE_OPTIONS.find((c) => c.value === cadence)?.label ?? '';
    if (cadence === 'twice_a_month') return `${base} — ${SEMI_MONTHLY_PRESETS[cutoffIdx].label}`;
    if (cadence === 'thrice_a_month') return `${base} — ${THRICE_MONTHLY_PRESET.label}`;
    if (cadence === 'weekly') return `${base} — every ${WEEKDAY_LABELS[weekday]}`;
    return `${base} — day ${dayOfMonth}`;
  }, [cadence, cutoffIdx, weekday, dayOfMonth]);

  const handleCompute = async () => {
    const clean = sanitizeAmount(amount);
    if (!clean) {
      toast.error('Enter a loan amount greater than zero (digits only).');
      return;
    }

    if (mode === 'manual') {
      const invalid = validateManualProduct(manual);
      if (invalid) {
        toast.error(invalid);
        return;
      }
      const result = await computeQuote({ kind: 'manual', manual, amount: clean });
      if (result) {
        setComp(result);
        setQuoted({ label: 'Manual computation', baseDeduction: manual.base_deduction });
      }
      return;
    }

    if (!product) {
      toast.error('Pick a loan product first, or switch to Manual entry.');
      return;
    }
    const result = await computeQuote({ kind: 'product', productId: product.id, amount: clean });
    if (result) {
      setComp(result);
      setQuoted({ label: product.description, baseDeduction: product.base_deduction });
    }
  };

  const tabClass = (active: boolean) =>
    `flex-1 rounded-sm px-4 py-2.5 text-sm font-medium transition ${
      active
        ? 'bg-primary text-white'
        : 'text-body hover:text-primary dark:text-bodydark dark:hover:text-white'
    }`;

  return (
    <div className="lc-print-root grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* ---------------- Operator controls ---------------- */}
      <section className="lc-no-print xl:col-span-5">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
            <h2 className="font-medium text-black dark:text-white">Quote a loan</h2>
            <p className="mt-1 text-xs text-bodydark2">
              Nothing on this screen is saved. No borrower or loan is created.
            </p>
          </div>

          <div className="space-y-5 p-6">
            {/* Mode switch */}
            <div className="flex gap-1 rounded-sm bg-whiten p-1 dark:bg-form-input">
              <button type="button" onClick={() => switchMode('product')} className={tabClass(mode === 'product')}>
                Saved product
              </button>
              <button type="button" onClick={() => switchMode('manual')} className={tabClass(mode === 'manual')}>
                Manual entry
              </button>
            </div>

            {mode === 'product' ? (
              <>
                <div>
                  <label className={LABEL_CLASS} htmlFor="lc-product">
                    Loan product
                  </label>
                  <AsyncReactSelect
                    inputId="lc-product"
                    loadOptions={searchProducts}
                    defaultOptions={products.map((p) => ({ value: p.id, label: p.description }))}
                    value={selected}
                    onChange={(opt) => {
                      setSelected(opt);
                      invalidate();
                    }}
                    isLoading={loadingProducts}
                    placeholder="Type to search (e.g. teacher 24, epza)…"
                    menuPosition="fixed"
                  />
                  <p className="mt-2 text-xs text-bodydark2">
                    {productsTruncated
                      ? 'Showing the first 200 products — type at least 2 characters to search the rest.'
                      : `${products.length} products available.`}{' '}
                    Not in the list yet? Use <span className="font-medium">Manual entry</span>.
                  </p>
                </div>

                {product ? (
                  <div className="rounded-sm bg-whiten p-4 dark:bg-form-input">
                    <p className="text-xs font-medium uppercase tracking-wider text-body dark:text-bodydark">
                      Product terms
                    </p>
                    <p className="mt-1 text-sm text-black dark:text-white">
                      {product.terms} months
                      {product.addon_terms ? ` + ${product.addon_terms} add-on months` : ''}
                      {' · '}
                      {product.base_deduction === 1
                        ? 'fees deducted from payout'
                        : 'fees added to the note'}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <ManualProductFields
                value={manual}
                onChange={(next) => {
                  setManual(next);
                  invalidate();
                }}
                fieldClass={FIELD_CLASS}
                labelClass={LABEL_CLASS}
              />
            )}

            <div>
              <label className={LABEL_CLASS} htmlFor="lc-amount">
                Loan amount
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-body dark:text-bodydark">
                  &#8369;
                </span>
                <input
                  id="lc-amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    invalidate();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !computing) handleCompute();
                  }}
                  placeholder="50000"
                  className={`${FIELD_CLASS} pl-9`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS} htmlFor="lc-cadence">
                  Payment cadence
                </label>
                <select
                  id="lc-cadence"
                  value={cadence}
                  onChange={(e) => setCadence(e.target.value as Cadence)}
                  className={FIELD_CLASS}
                >
                  {CADENCE_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                {cadence === 'twice_a_month' ? (
                  <>
                    <label className={LABEL_CLASS} htmlFor="lc-cutoff">
                      Cutoff days
                    </label>
                    <select
                      id="lc-cutoff"
                      value={cutoffIdx}
                      onChange={(e) => setCutoffIdx(Number(e.target.value))}
                      className={FIELD_CLASS}
                    >
                      {SEMI_MONTHLY_PRESETS.map((p, i) => (
                        <option key={p.label} value={i}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </>
                ) : cadence === 'weekly' ? (
                  <>
                    <label className={LABEL_CLASS} htmlFor="lc-weekday">
                      Collection day
                    </label>
                    <select
                      id="lc-weekday"
                      value={weekday}
                      onChange={(e) => setWeekday(Number(e.target.value))}
                      className={FIELD_CLASS}
                    >
                      {WEEKDAY_LABELS.map((d, i) => (
                        <option key={d} value={i}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </>
                ) : cadence === 'thrice_a_month' ? (
                  <>
                    <label className={LABEL_CLASS} htmlFor="lc-thrice">
                      Cutoff days
                    </label>
                    <input
                      id="lc-thrice"
                      type="text"
                      readOnly
                      value={THRICE_MONTHLY_PRESET.label}
                      className={FIELD_CLASS}
                    />
                  </>
                ) : (
                  <>
                    <label className={LABEL_CLASS} htmlFor="lc-day">
                      Day of month
                    </label>
                    <select
                      id="lc-day"
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(Number(e.target.value))}
                      className={FIELD_CLASS}
                    >
                      {DAY_OF_MONTH_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="lc-start">
                Start counting from
              </label>
              <input
                id="lc-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={FIELD_CLASS}
              />
              <p className="mt-2 text-xs text-bodydark2">
                The first due date is the next cutoff on or after this date.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCompute}
              disabled={computing}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3.5 font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-60"
            >
              {computing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Computing…
                </>
              ) : (
                'Compute quote'
              )}
            </button>

            {comp ? (
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full rounded-sm border border-primary px-6 py-3 font-medium text-primary transition hover:bg-primary hover:text-white"
              >
                Print quote for borrower
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* ---------------- Borrower-facing quote ---------------- */}
      <section className="xl:col-span-7">
        {comp && quoted ? (
          <QuotePanel
            comp={comp}
            schedule={schedule}
            productName={quoted.label}
            baseDeduction={quoted.baseDeduction}
            cadenceLabel={cadenceLabel}
          />
        ) : (
          <div className="lc-no-print flex h-full min-h-[24rem] flex-col items-center justify-center rounded-sm border border-dashed border-stroke bg-white p-10 text-center dark:border-strokedark dark:bg-boxdark">
            <p className="text-lg font-medium text-black dark:text-white">No quote yet</p>
            <p className="mt-2 max-w-sm text-sm text-bodydark2">
              Pick a loan product — or type the terms under{' '}
              <span className="font-medium text-black dark:text-white">Manual entry</span> — enter an
              amount, then press{' '}
              <span className="font-medium text-black dark:text-white">Compute quote</span>. The
              figures come from the same calculation used to price a real loan.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default LoanCalculator;
