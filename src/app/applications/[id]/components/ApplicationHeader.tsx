"use client";

import React, { useId } from 'react';
import { Clock, Home, type Icon } from 'react-feather';
import { formatSubmitted } from '@/app/applications/components/ApplicationColumns';
import ApplicationStatusPill, { APPLICATION_STATUS_DOT } from '@/app/applications/components/ApplicationStatusPill';
import { CHANNEL_ICONS, TINTS } from '@/app/applications/components/channelIcons';
import { CHANNEL_SHORT_LABELS } from '@/utils/applicationForm';
import { applicationNumber } from '@/utils/convertApplication';
import type { LoanApplicationRecord } from '@/utils/DataTypes';

/**
 * "Application #000007": the number staff say aloud to one another, and the one New
 * Borrower's banner and the printout carry (applicationNumber is shared with them).
 */
const ApplicationNumber: React.FC<{ id: string }> = ({ id }) => {
  const number = Number(id);
  if (!Number.isInteger(number)) return null;
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-body dark:text-bodydark">
      Application <span className="text-sm font-semibold tabular-nums tracking-normal text-black dark:text-white">{applicationNumber(number)}</span>
    </p>
  );
};

/**
 * Where the application came from: the source's icon in the tint the New application tiles
 * and the Source tracker give it, and its name, as short as the list's line under a name.
 * Nothing for an application with no source, as in the list. The words "Saan galing" are
 * printed from sm up; on a phone they are only for screen readers.
 */
const SourceFact: React.FC<{ channel: LoanApplicationRecord['channel'] }> = ({ channel }) => {
  if (!channel || !(channel in CHANNEL_SHORT_LABELS)) return null;
  const ChannelIcon = CHANNEL_ICONS[channel];
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <dt className="sr-only whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.08em] text-body dark:text-bodydark sm:not-sr-only">
        Saan galing
      </dt>
      <dd className="inline-flex min-w-0 items-center gap-2 font-medium text-black dark:text-white">
        <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${TINTS[channel]}`}>
          <ChannelIcon size={13} />
        </span>
        {CHANNEL_SHORT_LABELS[channel]}
      </dd>
    </div>
  );
};

const MetaItem: React.FC<{ icon: Icon; label: string; children: React.ReactNode }> = ({ icon: MetaIcon, label, children }) => (
  <div className="flex min-w-0 items-center gap-2">
    <MetaIcon aria-hidden="true" size={15} className="shrink-0 text-bodydark2" />
    <dt className="sr-only">{label}</dt>
    <dd className="min-w-0 break-words">{children}</dd>
  </div>
);

/**
 * The application's header, as a file's cover: its number and where it stands on top, the
 * applicant's name as the title, and under it where it came from, when it came in and which
 * branch has it. The edge carries the status's own colour (the one the pill and the list's
 * filter chips use), so the page says where the application stands before a word is read.
 *
 * The title can take focus by script (tabIndex -1, a ring for a keyboard only): it is where the
 * page puts the focus when the Retry button the keyboard was on goes away with nothing in its
 * place (the repeat-applicant check, RepeatApplicantCheck). `headingRef` is how it gets there.
 */
export const ApplicationHeader: React.FC<{ record: LoanApplicationRecord; headingRef?: React.Ref<HTMLHeadingElement> }> = ({ record, headingRef }) => {
  const titleId = useId();
  const submitted = formatSubmitted(record.submitted_at);
  return (
    <section
      aria-labelledby={titleId}
      className="relative overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${APPLICATION_STATUS_DOT[record.status] ?? 'bg-body'}`} />
      <div className="px-5 py-4 pl-7 sm:px-8 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <ApplicationNumber id={record.id} />
          <span className="ml-auto">
            <ApplicationStatusPill status={record.status} />
          </span>
        </div>
        <h3
          ref={headingRef}
          id={titleId}
          tabIndex={-1}
          className="mt-3 break-words rounded-sm text-title-sm2 font-semibold uppercase leading-tight text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:text-white dark:focus-visible:ring-offset-boxdark sm:text-title-md"
        >
          {record.full_name}
        </h3>
        <dl className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm text-body dark:text-bodydark">
          <SourceFact channel={record.channel} />
          {submitted && (
            <MetaItem icon={Clock} label="Submitted">
              {submitted}
            </MetaItem>
          )}
          <MetaItem icon={Home} label="Branch">
            {record.branch_sub?.name ?? <span className="italic">No branch yet</span>}
          </MetaItem>
        </dl>
      </div>
    </section>
  );
};
