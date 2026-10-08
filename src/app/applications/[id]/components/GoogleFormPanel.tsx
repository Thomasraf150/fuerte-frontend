"use client";

import React, { useId, useState } from 'react';
import { ChevronDown } from 'react-feather';
import { CARD_CLASS } from '@/components/Card';
import { IntakeFlagMark } from '@/app/applications/components/ApplicationStatusPill';
import { CHANNEL_ICONS, TINTS } from '@/app/applications/components/channelIcons';
import type { LoanApplicationAnswer } from '@/utils/DataTypes';

const GoogleFormIcon = CHANNEL_ICONS.google_form;

/** From here the page has two columns and the answers sit beside the form, open. Below it they are one tap away. */
const SIDE_BY_SIDE = '(min-width: 1280px)';

const startsOpen = (): boolean => typeof window !== 'undefined' && window.matchMedia(SIDE_BY_SIDE).matches;

/**
 * What the intake flagged, in the amber the list's flag mark and the upload result use. Flags
 * are notes for staff, never form fields: nothing here is saved.
 */
const FlagNotes: React.FC<{ flags: readonly string[] }> = ({ flags }) => {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="rounded-sm border border-warning/50 bg-warning/10 px-4 py-3">
      <h3 id={titleId} className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
        <IntakeFlagMark />
        Check these
      </h3>
      {/* text-black, not text-body: the muted grey is under 4.5:1 on the amber tint. */}
      <p className="mt-0.5 text-xs text-black dark:text-bodydark">Something in these answers looks off.</p>
      <ul className="mt-2 space-y-1 border-l-2 border-warning pl-3 text-sm text-black dark:text-white">
        {flags.map((flag, index) => (
          <li key={`${index}-${flag}`} className="break-words">
            {flag}
          </li>
        ))}
      </ul>
    </section>
  );
};

/**
 * The form's questions with the answers given, in the order they were asked. Read-only: the
 * form on the left is where an answer gets corrected. A question and its answer are a
 * term and its description, so a long answer wraps under its question instead of squeezing
 * a column. The disclosure is native: summary and Enter or Space, nothing to wire.
 */
const AnswersPanel: React.FC<{ answers: readonly LoanApplicationAnswer[] }> = ({ answers }) => {
  const [open] = useState(startsOpen);
  return (
    <details open={open} className={`group ${CARD_CLASS}`}>
      <summary className="flex min-h-12 list-none items-center gap-2.5 rounded-sm px-4 py-3 text-sm font-semibold text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:text-white [&::-webkit-details-marker]:hidden">
        {/* The Google Form source's own icon and tint: the same bubble the header and the New application tile give it. */}
        <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TINTS.google_form}`}>
          <GoogleFormIcon size={14} />
        </span>
        <span>From the Google Form</span>
        <span className="ml-auto shrink-0 text-xs font-normal text-body dark:text-bodydark">
          {answers.length === 1 ? '1 answer' : `${answers.length} answers`}
        </span>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className="shrink-0 text-bodydark2 transition-transform motion-reduce:transition-none group-open:rotate-180"
        />
      </summary>
      <dl className="divide-y divide-stroke border-t border-stroke dark:divide-strokedark dark:border-strokedark">
        {answers.map((item, index) => (
          <div key={`${index}-${item.question}`} className="px-4 py-3">
            <dt className="text-xs font-medium text-body dark:text-bodydark">{item.question}</dt>
            <dd className="mt-1 whitespace-pre-line break-words text-sm text-black dark:text-white">
              {(item.answer ?? '').trim() || <span className="text-body dark:text-bodydark">No answer</span>}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
};

interface GoogleFormPanelProps {
  flags: readonly string[];
  answers: readonly LoanApplicationAnswer[];
}

/**
 * The side panel: the intake's flags, then the Google Form's answers. On a phone it comes
 * before the form (collapsed, one row), because the flags are the first thing to know and
 * the form is long: it is first in the page's order too (ApplicationPage renders it before the
 * form), not moved there by CSS, so a screen reader and the Tab key reach it first as well. From
 * 1280px ApplicationPage's side column (with the Notes above it) sits beside the form and follows
 * the page as it scrolls.
 */
export const GoogleFormPanel: React.FC<GoogleFormPanelProps> = ({ flags, answers }) => (
  <aside aria-label="Google Form intake" className="space-y-4">
    {flags.length > 0 && <FlagNotes flags={flags} />}
    {answers.length > 0 && <AnswersPanel answers={answers} />}
  </aside>
);
