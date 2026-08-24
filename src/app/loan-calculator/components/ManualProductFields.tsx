'use client';

/**
 * Operator-typed rate card, for quoting a product the office has not set up yet.
 *
 * These values are SENT to the server, which prices them with the same code it
 * uses for a catalogue product (`manual_product` on LoanComputationInput makes
 * the resolver synthesise an unsaved LoanProducts). Nothing is computed here.
 */

import React from 'react';
import type { ManualProduct } from '@/utils/loanQuote';

interface ManualProductFieldsProps {
  value: ManualProduct;
  onChange: (next: ManualProduct) => void;
  fieldClass: string;
  labelClass: string;
}

/** Percentage inputs, in the order they appear on a printed rate sheet. */
const RATE_FIELDS: ReadonlyArray<{ key: keyof ManualProduct; label: string; hint?: string }> = [
  { key: 'udi', label: 'U.D.I', hint: 'interest' },
  { key: 'processing', label: 'Processing' },
  { key: 'collection', label: 'Collection' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'agent_fee', label: 'Agent fee' },
];

/** Flat peso charges — no percentage. */
const FEE_FIELDS: ReadonlyArray<{ key: keyof ManualProduct; label: string }> = [
  { key: 'notarial', label: 'Notarial fee' },
  { key: 'insurance_fee', label: 'Insurance fee' },
];

const ManualProductFields: React.FC<ManualProductFieldsProps> = ({
  value,
  onChange,
  fieldClass,
  labelClass,
}) => {
  const set = (key: keyof ManualProduct, next: string | number) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="space-y-5 rounded-sm border border-stroke p-4 dark:border-strokedark">
      <p className="text-xs text-bodydark2">
        Type the terms the borrower is asking about. Leave a fee blank if it does not apply.
      </p>

      <div className="flex items-end gap-4">
        <div className="w-32 shrink-0">
          <label className={labelClass} htmlFor="lc-m-terms">
            Terms <span className="text-danger">*</span>
          </label>
          <input
            id="lc-m-terms"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={value.terms}
            onChange={(e) => set('terms', e.target.value)}
            placeholder="12"
            className={fieldClass}
          />
        </div>
        <p className="pb-3 text-xs text-bodydark2">months</p>
      </div>

      {/* Own full-width row: a native <select> truncates rather than wraps, and
          these labels do not fit beside another field in this narrow panel. */}
      <div className="min-w-0">
        <label className={labelClass} htmlFor="lc-m-base">
          Fees are
        </label>
        <select
          id="lc-m-base"
          value={value.base_deduction}
          onChange={(e) => set('base_deduction', Number(e.target.value))}
          className={fieldClass}
        >
          <option value={1}>Deducted from the payout</option>
          <option value={0}>Added on top of the note</option>
        </select>
        <p className="mt-1.5 text-xs leading-relaxed text-bodydark2">
          {value.base_deduction === 1
            ? 'The note is for the amount applied for; the borrower receives less.'
            : 'The borrower receives the full amount; the note is larger.'}
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-body dark:text-bodydark">
          Rates (%)
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {RATE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs text-body dark:text-bodydark" htmlFor={`lc-m-${f.key}`}>
                {f.label}
                {f.hint ? <span className="text-bodydark2"> ({f.hint})</span> : null}
              </label>
              <div className="relative">
                <input
                  id={`lc-m-${f.key}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={String(value[f.key] ?? '')}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder="0"
                  className={`${fieldClass} py-2 pr-7`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-bodydark2">
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-body dark:text-bodydark">
          Flat fees
        </p>
        <div className="grid grid-cols-2 gap-3">
          {FEE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs text-body dark:text-bodydark" htmlFor={`lc-m-${f.key}`}>
                {f.label}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-bodydark2">
                  &#8369;
                </span>
                <input
                  id={`lc-m-${f.key}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={String(value[f.key] ?? '')}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder="0"
                  className={`${fieldClass} py-2 pl-7`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <details className="rounded-sm bg-whiten p-3 dark:bg-form-input">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-body dark:text-bodydark">
          Add-on (optional)
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-body dark:text-bodydark" htmlFor="lc-m-addon-terms">
              Add-on months
            </label>
            <input
              id="lc-m-addon-terms"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={value.addon_terms}
              onChange={(e) => set('addon_terms', e.target.value)}
              placeholder="0"
              className={`${fieldClass} py-2`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-body dark:text-bodydark" htmlFor="lc-m-addon-udi">
              Add-on U.D.I (%)
            </label>
            <input
              id="lc-m-addon-udi"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={value.addon_udi_rate}
              onChange={(e) => set('addon_udi_rate', e.target.value)}
              placeholder="0"
              className={`${fieldClass} py-2`}
            />
          </div>
        </div>
      </details>
    </div>
  );
};

export default ManualProductFields;
