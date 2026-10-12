"use client";

import React from 'react';
import { formatPeriod, matchingPreset, presetDates, PRESET_LABELS, ymdOf, type ReportPreset } from '@/utils/reportPeriod';

interface PeriodPresetsProps {
  presets: readonly ReportPreset[];
  start: Date | null | undefined;
  end: Date | null | undefined;
  /** Both dates at once, so a report fetches once rather than once per date. */
  onPick: (start: Date, end: Date) => void;
  disabled?: boolean;
  className?: string;
}

const CHIP =
  'inline-flex min-h-12 items-center justify-center whitespace-nowrap border px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-boxdark lg:min-h-10';
const CHIP_ON = 'border-primary bg-primary text-white';
const CHIP_OFF =
  'border-stroke bg-white text-black hover:border-primary hover:text-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:text-olive-300';

/**
 * One-click periods beside a report's own date pickers, and the period on screen in
 * words. The pickers stay where staff know them; these only fill both at once. The
 * pressed button is whichever preset the dates exactly are, so editing a date by hand
 * releases it ("Custom" is simply the pickers). Research: Stripe/Shopify presets, NN/g
 * "do not default to totally empty states" (see utils/reportPeriod.ts).
 */
const PeriodPresets: React.FC<PeriodPresetsProps> = ({ presets, start, end, onPick, disabled = false, className = '' }) => {
  const active = matchingPreset(presets, start, end);

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between ${className}`}>
      <div role="group" aria-label="Quick periods" className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={active === preset}
            disabled={disabled}
            onClick={() => {
              const { start: s, end: e } = presetDates(preset);
              onPick(s, e);
            }}
            className={`${CHIP} ${active === preset ? CHIP_ON : CHIP_OFF}`}
          >
            {PRESET_LABELS[preset]}
          </button>
        ))}
      </div>
      {start && end && (
        <p aria-live="polite" className="text-sm text-body dark:text-bodydark">
          Showing{' '}
          <span className="font-semibold text-black dark:text-white">
            {formatPeriod({ from: ymdOf(start), to: ymdOf(end) })}
          </span>
        </p>
      )}
    </div>
  );
};

export default PeriodPresets;
