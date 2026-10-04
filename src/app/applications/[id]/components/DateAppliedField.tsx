"use client";

import React, { useId } from 'react';
import type { UseFormRegister } from 'react-hook-form';
import { Calendar, Info } from 'react-feather';

/** Why the day is not final: it came from a Sheet paste or a PDF, which knows the day at best. */
export const DATE_APPLIED_HINT = "From a Sheet paste or a PDF, so it may be off. Google's download will set the exact time.";

/** What a cleared field is stopped with: the form does not save an application with no day applied. */
export const DATE_APPLIED_REQUIRED = 'Choose the date applied.';

/**
 * The same box as every other text field of the form (FormInput's: 48px on a phone, 40px from
 * md up, the icon on the left), written out here because the hint below it has to be the input's
 * description, which FormInput has no way to carry.
 */
const INPUT =
  'h-12 w-full border py-3 pl-11.5 pr-4.5 text-sm text-black focus:border-primary focus-visible:outline-none md:h-10 dark:bg-meta-4 dark:text-white dark:focus:border-primary';

interface DateAppliedFieldProps {
  /** The form's own register (BorrowerDetails hands it to renderExtraFields). */
  register: UseFormRegister<any>;
  /** The form's message for this field while the last Save was stopped by it. */
  error: string | undefined;
  /** Y-m-d: the earliest and the latest day the input takes (see dateAppliedBounds). */
  min: string;
  max: string;
}

/**
 * "Date applied": a date input in the form, bound to submitted_on, for a Google Form
 * application whose date is only a guess (see canCorrectDateApplied). It starts on the day the
 * application has; the page sends a day only when it was changed. It is REQUIRED, like the form's
 * other starred fields (react-hook-form's rule, not the browser's, so the words are the page's
 * own): a cleared field would otherwise save as "no change" and stay empty while the server kept
 * its day. Labelled, with its hint, and the message while there is one, as its description. The
 * native bounds are the server's (2020-01-01 to today in Manila): a day outside them is stopped
 * by the browser, and one the browser lets through is refused by the server with its own words.
 */
export const DateAppliedField: React.FC<DateAppliedFieldProps> = ({ register, error, min, max }) => {
  const hintId = useId();
  const errorId = useId();
  return (
    <div className="md:max-w-xs">
      <label htmlFor="submitted_on" className="mb-3 block text-sm font-medium text-black dark:text-white">
        Date applied
        <span aria-hidden="true" className="ml-1 font-bold text-danger">
          *
        </span>
      </label>
      <div className="relative">
        <input
          id="submitted_on"
          type="date"
          min={min}
          max={max}
          aria-required="true"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${errorId} ${hintId}` : hintId}
          className={`${INPUT} ${error ? 'border-danger dark:border-danger' : 'border-stroke dark:border-strokedark'}`}
          {...register('submitted_on', { required: DATE_APPLIED_REQUIRED })}
        />
        <span aria-hidden="true" className="pointer-events-none absolute left-4.5 top-4 md:top-3">
          <Calendar size={18} />
        </span>
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <p id={hintId} className="mt-2 flex items-start gap-1.5 text-xs text-body dark:text-bodydark">
        <Info aria-hidden="true" size={14} className="mt-px shrink-0" />
        <span className="min-w-0">{DATE_APPLIED_HINT}</span>
      </p>
    </div>
  );
};
