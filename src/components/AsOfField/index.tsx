"use client";

import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { dateOf, formatPeriod, manilaToday, ymdOf } from '@/utils/reportPeriod';

interface AsOfFieldProps {
  id: string;
  /** `Y-m-d`. */
  value: string;
  onChange: (ymd: string) => void;
  disabled?: boolean;
}

const FIELD =
  'h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white';

/**
 * The "as of" day for a cumulative report (Trial Balance): everything posted up to and
 * including it. Opens on today; "Back to today" returns there in one click. It reads the
 * day back in words so nobody has to decode 10/12/2026.
 */
const AsOfField: React.FC<AsOfFieldProps> = ({ id, value, onChange, disabled = false }) => {
  const today = manilaToday();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="w-full sm:max-w-xs">
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-black dark:text-white">As of</label>
        <DatePicker
          id={id}
          selected={dateOf(value)}
          onChange={(date: Date | null) => date && onChange(ymdOf(date))}
          disabled={disabled}
          wrapperClassName="w-full"
          className={FIELD}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <p aria-live="polite" className="text-sm text-body dark:text-bodydark">
          Everything posted up to{' '}
          <span className="font-semibold text-black dark:text-white">{formatPeriod({ from: value, to: value })}</span>
        </p>
        {value !== today && (
          <button
            type="button"
            onClick={() => onChange(today)}
            disabled={disabled}
            className="inline-flex min-h-12 items-center border border-stroke bg-white px-4 text-sm font-semibold text-black hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-strokedark dark:bg-boxdark dark:text-white lg:min-h-10"
          >
            Back to today
          </button>
        )}
      </div>
    </div>
  );
};

export default AsOfField;
