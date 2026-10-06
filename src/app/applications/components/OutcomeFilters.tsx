"use client";

import React, { useId } from 'react';
import { ChevronDown, X } from 'react-feather';
import type { ApplicationOutcome } from '@/utils/DataTypes';
import { OUTCOMES, isOutcome } from '@/utils/applicationOutcome';
import { formatPeriod, type DayRange } from '@/utils/sourceTracker';

const RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 dark:focus-visible:ring-offset-boxdark';

/**
 * Outcome: the system's own select, as the application page's Status is. Eleven choices are too
 * many for chips on a phone, and the OS's list is the right control there. "Any outcome" sends none.
 * 48px tall below lg, 40px from lg.
 */
const OutcomeSelect: React.FC<{ value: ApplicationOutcome | null; onChange: (next: ApplicationOutcome | null) => void }> = ({
  value,
  onChange,
}) => {
  const id = useId();
  return (
    <div className="flex min-w-0 items-center gap-3">
      <label htmlFor={id} className="shrink-0 text-[11px] font-medium uppercase tracking-[0.08em] text-body dark:text-bodydark">
        Outcome
      </label>
      <div className="relative min-w-0 flex-1 sm:flex-none">
        <select
          id={id}
          value={value ?? ''}
          onChange={(event) => onChange(isOutcome(event.target.value) ? event.target.value : null)}
          className={`h-12 w-full appearance-none rounded-full border bg-white pl-4 pr-10 text-sm font-medium text-black transition-colors hover:border-primary/50 dark:bg-boxdark dark:text-white sm:w-auto sm:min-w-[14rem] lg:h-10 ${RING} ${
            value ? 'border-primary ring-1 ring-inset ring-primary' : 'border-stroke dark:border-strokedark'
          }`}
        >
          <option value="">Any outcome</option>
          {OUTCOMES.map((outcome) => (
            <option key={outcome.key} value={outcome.key}>
              {outcome.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-bodydark2" />
      </div>
    </div>
  );
};

/**
 * "Applied Oct 1 – Oct 31, 2026", as a removable chip: shown only while the list is limited to the
 * days a link from the Source tracker asked for. The ✕ is its own button, named for what it does.
 */
const PeriodChip: React.FC<{ period: DayRange; onClear: () => void }> = ({ period, onClear }) => {
  const words = `Applied ${formatPeriod(period)}`;
  return (
    <span className="inline-flex min-h-12 max-w-full items-center gap-1 rounded-full border border-primary bg-primary/10 pl-4 text-sm font-medium text-black ring-1 ring-inset ring-primary dark:bg-primary/20 dark:text-white lg:min-h-10">
      <span className="min-w-0 truncate" data-testid="period-chip">{words}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove the period: ${words}`}
        className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-black transition-colors hover:bg-primary/15 dark:text-white lg:h-10 lg:w-10 ${RING}`}
      >
        <X aria-hidden="true" size={16} />
      </button>
    </span>
  );
};

interface OutcomeFiltersProps {
  outcome: ApplicationOutcome | null;
  period: DayRange | null;
  onOutcome: (next: ApplicationOutcome | null) => void;
  onClearPeriod: () => void;
}

/** The Outcome select, and the period chip while there is one. Wraps under each other on a phone. */
const OutcomeFilters: React.FC<OutcomeFiltersProps> = ({ outcome, period, onOutcome, onClearPeriod }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
    <OutcomeSelect value={outcome} onChange={onOutcome} />
    {period && <PeriodChip period={period} onClear={onClearPeriod} />}
  </div>
);

export default OutcomeFilters;
