"use client";

import React, { useId } from 'react';
import { UserPlus } from 'react-feather';
import type { UseFormRegister } from 'react-hook-form';
import { KINDS, KIND_LABELS } from '@/utils/applicationForm';
import type { LoanApplicationKind } from '@/utils/DataTypes';
import { KIND_ICONS } from './KindBadge';

const HINTS: Readonly<Record<LoanApplicationKind, string>> = {
  new: 'Bagong borrower',
  renewal: 'Uulitin ang loan',
  additional: 'Dagdag habang may loan pa',
};

const ICONS = { new: UserPlus, ...KIND_ICONS };

/*
 * One bar of three segments, not tiles: it is a smaller decision than Saan galing below it, and
 * it starts on Bago, so most entries never touch it. Each segment is a label round a real radio
 * (sr-only, the `peer`), so the native radio group gives Tab, the arrow keys and screen readers.
 * 48px tall on phones; the hint drops below the word there and sits beside it from sm.
 */
const SEGMENT =
  'flex h-full min-h-12 flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-center transition-colors duration-150 ' +
  'hover:bg-gray-2 dark:hover:bg-meta-4 ' +
  'peer-checked:bg-primary peer-checked:text-white peer-checked:hover:bg-primary ' +
  'peer-focus-visible:ring-2 peer-focus-visible:ring-inset peer-focus-visible:ring-accent ' +
  'sm:flex-row sm:gap-2 md:min-h-11';

/**
 * "Ano ang ina-apply?": a new applicant (Bago), or a borrower already, renewing or adding a loan
 * (spec 2026-10-21). Registered as `kind` on BorrowerDetails' own form through renderExtraFields;
 * Bago is checked to begin with, so it is never blank.
 */
const KindField: React.FC<{ register: UseFormRegister<any> }> = ({ register }) => {
  const id = useId();
  const field = register('kind');
  return (
    <fieldset>
      <legend className="mb-3 block text-sm font-medium text-black dark:text-white">Ano ang ina-apply?</legend>
      <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
        {KINDS.map((kind, index) => {
          const KindIcon = ICONS[kind];
          return (
            <label key={kind} className={`relative block cursor-pointer ${index > 0 ? 'border-l border-stroke dark:border-strokedark' : ''}`}>
              <input
                type="radio"
                value={kind}
                defaultChecked={kind === 'new'}
                className="peer sr-only"
                aria-describedby={`${id}-${kind}-hint`}
                {...field}
              />
              <span className={`${SEGMENT} text-black dark:text-white`}>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <KindIcon aria-hidden="true" size={15} className="shrink-0" />
                  {KIND_LABELS[kind]}
                </span>
                <span id={`${id}-${kind}-hint`} className="text-[11px] leading-tight opacity-75">
                  {HINTS[kind]}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default KindField;
