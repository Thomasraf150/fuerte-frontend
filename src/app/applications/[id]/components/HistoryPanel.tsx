"use client";

import React, { useId } from 'react';
import { ArrowRight } from 'react-feather';
import { Card, CardHeader } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { APPLICATION_STATUS_LABEL } from '@/app/applications/components/ApplicationStatusPill';
import { formatSubmitted } from '@/app/applications/components/ApplicationColumns';
import { formatMoneyOrBlank } from '@/utils/helper';
import { manilaToday } from '@/utils/sourceTracker';
import type { ApplicationHistoryChange, ApplicationHistoryEntry, LoanApplicationStatus } from '@/utils/DataTypes';

/** How it came in, as an added line says it. */
const HOW: Record<string, string> = {
  upload: 'Added it from the Google Forms download',
  paste: 'Pasted it from the Google Sheet',
  pdf: 'Added it from a Google Form PDF',
  typed: 'Typed it in as a new application',
  google_form: 'Added it from the Google Form',
};

/** What happened, by the line's kind. */
const WHAT: Record<string, string> = {
  joined: 'Its Google Form response came in and was matched to it',
  edited: 'Edited the application',
  status: 'Changed the status',
  converted: 'Created the borrower from it',
  system_fix: 'Corrected automatically',
};

/** The words for each field a line changed. */
const FIELD: Record<string, string> = {
  full_name: 'Name',
  // The same name split another way (first / middle / last): what Create as borrower copies.
  name_parts: 'Name split',
  contact_no: 'Mobile',
  branch: 'Branch',
  submitted_at: 'Date applied',
  amount_applied: 'Amount',
  purpose: 'Purpose',
  details: 'Also edited',
  status: 'Status',
  decline_reason: 'Reason',
};

/** A stored value as the rest of the page shows it: the date applied, a peso amount, a status's words. */
const shown = (field: string, value: string | null): string | null => {
  if (value === null) return null;
  if (field === 'submitted_at') return formatSubmitted(value);
  if (field === 'amount_applied') {
    const amount = formatMoneyOrBlank(value);
    return amount ? `₱${amount}` : value;
  }
  if (field === 'status') return APPLICATION_STATUS_LABEL[value as LoanApplicationStatus] ?? value;
  return value;
};

/** Manila 'Y-m-d H:i:s' as a Date, or null when it is not one (the server's strings carry no zone; Manila has no daylight saving). */
const manila = (at: string): Date | null => {
  const date = new Date(`${at.replace(' ', 'T')}+08:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const timeOf = (at: string): string =>
  manila(at)?.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }) ?? '';

/** "Today", "Yesterday", or "Tuesday, October 14, 2026"; "Earlier" for a line with no readable day. */
const dayHeading = (ymd: string, today: string): string => {
  const date = manila(`${ymd} 12:00:00`);
  if (!date) return 'Earlier';
  if (ymd === today) return 'Today';
  const yesterday = new Date(`${today}T12:00:00+08:00`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (ymd === yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })) return 'Yesterday';
  return date.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

/** The lines by Manila day, newest first, keeping the server's order within a day. */
const byDay = (entries: readonly ApplicationHistoryEntry[]): { day: string; entries: ApplicationHistoryEntry[] }[] => {
  const days: { day: string; entries: ApplicationHistoryEntry[] }[] = [];
  for (const entry of entries) {
    const day = entry.at.slice(0, 10);
    const last = days[days.length - 1];
    if (last && last.day === day) last.entries.push(entry);
    else days.push({ day, entries: [entry] });
  }
  return days;
};

/**
 * One field it changed: the old value struck through, then the new one. A screen reader hears
 * "from … to …"; the arrow and the strike are decoration. "Also edited" names the other groups,
 * and a decline's reason is the staff's own words, set off by a rule as in the Notes panel.
 */
const ChangeRow: React.FC<{ change: ApplicationHistoryChange }> = ({ change }) => {
  const label = FIELD[change.field] ?? change.field;
  const from = shown(change.field, change.from);
  const to = shown(change.field, change.to);
  if (change.field === 'details' || change.field === 'decline_reason') {
    return (
      <li className="text-sm">
        <span className="text-body dark:text-bodydark">{label}: </span>
        <span className={change.field === 'decline_reason' ? 'mt-1 block whitespace-pre-line break-words border-l-2 border-danger/70 pl-3 text-black dark:text-bodydark' : 'text-black dark:text-white'}>
          {to ?? '—'}
        </span>
      </li>
    );
  }
  return (
    <li className="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-x-3 text-sm">
      <span className="text-body dark:text-bodydark">{label}</span>
      <span className="min-w-0 break-words">
        {from !== null && (
          <>
            <span className="sr-only">from </span>
            <del className="text-body decoration-body/60 dark:text-bodydark">{from}</del>
            <ArrowRight aria-hidden="true" size={13} className="mx-1.5 inline-block align-[-2px] text-body dark:text-bodydark" />
            <span className="sr-only"> to </span>
          </>
        )}
        {to !== null ? (
          <ins className="font-semibold text-black no-underline dark:text-white">{to}</ins>
        ) : (
          <span className="italic text-body dark:text-bodydark">cleared</span>
        )}
      </span>
    </li>
  );
};

/**
 * One line: who (the person's name and role, or System for an automatic fix, never mistaken for a
 * person), when, what happened, and the fields it changed. Its dot sits on the day's rule: olive for
 * a person, gold for the system.
 */
const HistoryLine: React.FC<{ entry: ApplicationHistoryEntry }> = ({ entry }) => {
  const system = entry.kind === 'system_fix';
  const what = entry.kind === 'added' ? HOW[entry.via ?? ''] ?? 'Added it' : WHAT[entry.kind] ?? 'Changed it';
  const changes = entry.changes ?? [];
  const at = manila(entry.at);
  return (
    <li data-history={entry.kind} className="relative">
      <span
        aria-hidden="true"
        className={`absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-boxdark ${system ? 'bg-secondary' : 'bg-primary dark:bg-olive-300'}`}
      />
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {system ? (
          <StatusBadge tone="pending" icon={false}>System</StatusBadge>
        ) : (
          <span className="font-semibold text-black dark:text-white">{entry.actor_name ?? 'A former user'}</span>
        )}
        {!system && entry.actor_role && (
          <span className="text-body dark:text-bodydark">
            <span aria-hidden="true">· </span>
            {entry.actor_role}
          </span>
        )}
        {at && (
          <time dateTime={at.toISOString()} className="ml-auto text-xs tabular-nums text-body dark:text-bodydark">
            {timeOf(entry.at)}
          </time>
        )}
      </p>
      <p className="mt-0.5 text-sm text-black dark:text-bodydark">{what}</p>
      {entry.note && <p className="mt-1 text-xs text-body dark:text-bodydark">{entry.note}</p>}
      {changes.length > 0 && (
        <ul aria-label="What changed" className="mt-2 space-y-1.5">
          {changes.map((change, i) => (
            <ChangeRow key={`${change.field}-${i}`} change={change} />
          ))}
        </ul>
      )}
    </li>
  );
};

/**
 * History (/applications/[id], 2026-10-14): who changed what on this application -- by name and role
 * (Rafael: "so people know who is making edits") -- newest first, under a heading per Manila day.
 * Lists are real lists, so a screen reader announces how many days and lines there are; the rule and
 * the dots are decoration (Primer's timeline notes). An application from before then shows only who
 * added it, which the description says.
 */
export const HistoryPanel: React.FC<{ history: readonly ApplicationHistoryEntry[] | null | undefined }> = ({ history }) => {
  const titleId = useId();
  const entries = history ?? [];
  const today = manilaToday();
  return (
    <Card aria-labelledby={titleId} className="overflow-hidden">
      <CardHeader
        id={titleId}
        title="History"
        description="Who changed what, newest first. Changes are recorded since the History tab was added; before that, only who added the application is known."
      />
      {entries.length === 0 ? (
        <p className="px-4 py-6 text-sm text-body sm:px-6 dark:text-bodydark">Nothing recorded yet.</p>
      ) : (
        <ol className="divide-y divide-stroke px-4 sm:px-6 dark:divide-strokedark">
          {byDay(entries).map(({ day, entries: lines }) => (
            <li key={day} className="py-4">
              <h4 className="font-display text-sm font-semibold tracking-tight text-black dark:text-white">{dayHeading(day, today)}</h4>
              <ol className="ml-1.5 mt-3 space-y-5 border-l-2 border-stroke pl-5 dark:border-strokedark">
                {lines.map((entry, i) => (
                  <HistoryLine key={`${entry.at}-${entry.kind}-${i}`} entry={entry} />
                ))}
              </ol>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
};
