"use client";

import React, { useId } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar } from 'react-feather';
import { MIN_BUSINESS_DATE } from '@/constants/dateBounds';
import type { DayRange, Period } from '@/utils/sourceTracker';

const PERIODS: readonly { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'custom', label: 'Custom' },
];

/*
 * The same chips as the Applications status filter, so the control is familiar:
 * 48px tall on phones (a touch target), denser from md up.
 */
const CHIP =
  'inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 dark:focus-visible:ring-offset-boxdark sm:px-4 sm:text-sm md:min-h-9';
const CHIP_ON =
  'border-primary bg-primary/10 text-primary ring-1 ring-inset ring-primary dark:bg-primary/20 dark:text-white';
const CHIP_OFF =
  'border-stroke bg-white text-body hover:border-primary/50 hover:text-black dark:border-strokedark dark:bg-boxdark dark:text-bodydark1 dark:hover:text-white';

const LABEL = 'mb-1.5 block text-sm font-medium text-black dark:text-white';
// Dark mode: the native calendar button is drawn dark unless the field says it is on a dark page.
const FIELD =
  'h-12 w-full rounded-sm border border-stroke bg-transparent px-3 text-sm text-black outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:[color-scheme:dark] md:h-10';
const APPLY =
  'inline-flex min-h-12 items-center justify-center rounded bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark md:min-h-10';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The earliest day To may take: From, so a range cannot run backwards, and never before the
 * floor both boxes share. A From that is not a whole day yet (empty, or a year typed halfway,
 * which sits below the floor) leaves just the floor. Years are four digits, so comparing the
 * text compares the days.
 */
const toMin = (from: string): string => (DAY.test(from) && from > MIN_BUSINESS_DATE ? from : MIN_BUSINESS_DATE);

/**
 * Custom: two date boxes and Apply. Nothing is asked of the server until Apply, so a
 * range is never half chosen on the way to the one wanted. The browser's own checks stop
 * what it can see: an empty box, a year typed halfway ("0002"), and a range running
 * backwards (`required`, `min` on both, and To's `min` following From; the same gate the
 * app's other date fields use, see src/constants/dateBounds.ts). The server still decides
 * the one thing the browser cannot know, a range over a year, and its message is shown.
 *
 * From carries no `max` to match: its calendar would then grey out every day after the
 * To already chosen, so a range could not be moved forward From-first. A backwards range
 * is stopped on To's `min` either way. Mounted only while Custom is chosen, so each time
 * it opens it starts from the days on screen.
 */
const CustomRange: React.FC<{ range: DayRange; onApply: (range: DayRange) => void }> = ({ range, onApply }) => {
  const id = useId();
  const { register, handleSubmit, watch } = useForm<DayRange>({ defaultValues: range });

  return (
    <form
      aria-label="Custom period"
      onSubmit={handleSubmit((values) => onApply({ from: values.from, to: values.to }))}
      className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end md:max-w-xl"
    >
      <div>
        <label htmlFor={`${id}-from`} className={LABEL}>From</label>
        <input id={`${id}-from`} type="date" required min={MIN_BUSINESS_DATE} className={FIELD} {...register('from')} />
      </div>
      <div>
        <label htmlFor={`${id}-to`} className={LABEL}>To</label>
        <input id={`${id}-to`} type="date" required min={toMin(watch('from'))} className={FIELD} {...register('to')} />
      </div>
      <button type="submit" className={APPLY}>Apply</button>
    </form>
  );
};

interface PeriodPickerProps {
  period: Period;
  /** The days on screen: Custom starts from them. */
  range: DayRange;
  onSelect: (period: Period) => void;
  onApplyCustom: (range: DayRange) => void;
}

/** Today, This week, This month, Last month and Custom, as pressed-state buttons; Custom opens its two dates below. */
const PeriodPicker: React.FC<PeriodPickerProps> = ({ period, range, onSelect, onApplyCustom }) => (
  <div className="space-y-4">
    <div role="group" aria-label="Period" className="flex flex-wrap gap-2">
      {PERIODS.map(({ value, label }) => {
        const selected = period === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(value)}
            className={`${CHIP} ${selected ? CHIP_ON : CHIP_OFF}`}
          >
            {value === 'custom' && <Calendar aria-hidden="true" size={14} className="shrink-0" />}
            {label}
          </button>
        );
      })}
    </div>
    {period === 'custom' && <CustomRange range={range} onApply={onApplyCustom} />}
  </div>
);

export default PeriodPicker;
