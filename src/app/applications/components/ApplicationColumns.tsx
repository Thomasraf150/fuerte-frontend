"use client";

import React from 'react';
import Link from 'next/link';
import { TableColumn } from 'react-data-table-component';
import { LoanApplicationRow } from '@/utils/DataTypes';
import { CHANNEL_SHORT_LABELS } from '@/utils/applicationForm';
import { formatMoneyOrBlank } from '@/utils/helper';
import ApplicationStatusPill, { IntakeFlagMark } from './ApplicationStatusPill';
import { CHANNEL_ICONS } from './channelIcons';
import OutcomePill from './OutcomePill';

/*
 * `hide` removes a column at viewport widths up to and including the number.
 * These breakpoints rely on the app-wide table-fit settings: useDatatableTheme's
 * `tableWrapper` display:block, which sizes a table to its container rather than
 * its content, and react-data-table-component's own 100px column default (three
 * columns of 101px fill the 302px table at 360px). With those and
 * ApplicationList's padding:
 *   - up to 599px: Name, Branch, Status (3 columns; 302px of table at 360px);
 *   - 600px and up: plus Mobile and Amount (5 columns);
 *   - 768px and up: plus Submitted (6 columns);
 *   - 1140px and up: plus Purpose (7 columns, beside the 290px sidebar).
 * Ids are strings on purpose: borrowers/styles.css and payment-posting/styles.css
 * hide NUMERIC column ids on phones, and Next keeps page CSS loaded app-wide.
 */
const HIDE_ON_PHONE = 599;
const HIDE_BELOW_TABLET = 767;
const HIDE_BELOW_LAPTOP = 1139;

/**
 * "2026-09-21 20:05:31" (Manila wall-clock from the server) → "Sep 21, 2026, 8:05 PM", in any
 * browser zone. Exactly midnight is a row pasted from the Sheet with only its day ("10/1/2026"),
 * so it shows the date alone, "Oct 1, 2026", until Google's download gives it the time.
 */
export const formatSubmitted = (value: string | null): string => {
  if (!value) return '';
  // The server's string carries no zone. Pin it to Manila (+08:00, no daylight
  // saving) and format in Manila, so the digits shown are the digits stored.
  const date = new Date(`${value.replace(' ', 'T')}+08:00`);
  if (Number.isNaN(date.getTime())) return value;
  const time: Intl.DateTimeFormatOptions = value.endsWith(' 00:00:00') ? {} : { hour: 'numeric', minute: '2-digit' };
  return date.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...time,
  });
};

const formatAmount = (value: string | null): string => {
  const amount = formatMoneyOrBlank(value);
  return amount ? `₱${amount}` : '';
};

/**
 * One line with an ellipsis. RDT renders a `cell` straight into its flex cell,
 * where text-overflow cannot apply, so the text needs a box of its own.
 * white-space is inherited from the cell (nowrap), which keeps the app's
 * row-hover reveal in app/styles.css working.
 *
 * data-tag="allowRowEvents" is what makes a click here open the row. RDT runs
 * onRowClicked only when the click's target element carries it: its own cells
 * do, but the content a custom `cell` renders does not, so without it a click on
 * a cell's text opens nothing. Every element in a row that is not a control
 * carries it (see also NameCell, StatusCell and ApplicationStatusPill). The Name
 * link does not: it navigates by itself, and tagged, the row would navigate a
 * second time.
 */
const CellText: React.FC<{ children: React.ReactNode; title?: string; className?: string }> = ({
  children,
  title,
  className = '',
}) => (
  <span data-tag="allowRowEvents" title={title} className={`min-w-0 overflow-hidden text-ellipsis ${className}`}>
    {children}
  </span>
);

/** The assigned branch. Until there is one, the form's answer, muted and slanted, so it never reads as an assignment. */
const BranchCell: React.FC<{ row: LoanApplicationRow }> = ({ row }) => {
  if (row.branch_sub) {
    return <CellText title={row.branch_sub.name}>{row.branch_sub.name}</CellText>;
  }
  const location = row.location?.trim();
  if (!location) {
    return <CellText className="italic text-body dark:text-bodydark2">Not set</CellText>;
  }
  return (
    <CellText title={`${location} (the form's answer; no branch assigned yet)`} className="italic text-body dark:text-bodydark2">
      <span className="sr-only">Not assigned. The form says: </span>
      {location}
    </CellText>
  );
};

/*
 * The name as a link. At rest it is the plain name, so a column of them still scans;
 * the underline arrives on hover and a ring on keyboard focus (the page's own focus
 * ring; white on the dark rows, where primary is too dim). The py-0.5 and the thin,
 * close underline keep the line inside the box: overflow-hidden, needed for the
 * ellipsis, would clip it. Same truncation as CellText, but no data-tag.
 */
const NAME_LINK =
  'overflow-hidden text-ellipsis uppercase rounded-sm py-0.5 font-medium text-black underline decoration-1 decoration-transparent underline-offset-[3px] transition-colors hover:decoration-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 dark:text-white dark:hover:decoration-white dark:focus-visible:ring-white dark:focus-visible:ring-offset-boxdark';

/**
 * The name, a link to the application, and under it where the application came from
 * (Saan galing): the source's icon and short label, muted. No coloured dot: dots mean
 * status on this page. A row without a channel shows the name alone.
 *
 * The link is the keyboard and screen-reader way in (one tab stop a row), and a
 * ctrl-click still opens a new tab. Clicking anywhere else in the row opens the
 * same page (ApplicationList's onRowClicked). prefetch is off: a page holds up to 100
 * rows, and a prefetch each is far more traffic than one click needs.
 */
const NameCell: React.FC<{ row: LoanApplicationRow }> = ({ row }) => {
  const channel = row.channel && row.channel in CHANNEL_SHORT_LABELS ? row.channel : null;
  const ChannelIcon = channel ? CHANNEL_ICONS[channel] : null;
  return (
    <span className="flex min-w-0 flex-col">
      <Link href={`/applications/${row.id}`} prefetch={false} title={row.full_name} className={NAME_LINK}>
        {row.full_name}
      </Link>
      {channel && ChannelIcon && (
        <span data-tag="allowRowEvents" className="flex min-w-0 items-center gap-1 text-xs text-body dark:text-bodydark">
          {/* A decoration: pointer-events-none lets a click on it reach the tagged line, so it opens the row too. */}
          <ChannelIcon aria-hidden="true" size={12} className="pointer-events-none shrink-0" />
          <CellText>
            <span className="sr-only">Saan galing: </span>
            {CHANNEL_SHORT_LABELS[channel]}
          </CellText>
        </span>
      )}
    </span>
  );
};

/**
 * The status, and under it, once the application is a borrower, where it ended up (OutcomePill:
 * "Loan released", "Rejected by Marketing"). Before that the outcome IS the status (For Interview,
 * Interviewed, Declined), so it is not said twice. Stacked in the Status column rather than a
 * column of its own: three columns already fill a phone, and a seventh would not fit beside the
 * sidebar on a laptop.
 */
const StatusCell: React.FC<{ row: LoanApplicationRow }> = ({ row }) => {
  const flags = row.intake_flags ?? [];
  const showOutcome = row.status === 'borrower_created' && !!row.outcome;
  return (
    <span data-tag="allowRowEvents" className="flex min-w-0 flex-col items-start gap-1 py-1">
      <span data-tag="allowRowEvents" className="flex min-w-0 max-w-full items-center gap-1 sm:gap-1.5">
        <ApplicationStatusPill status={row.status} />
        {flags.length > 0 && <IntakeFlagMark label={`Check: ${flags.join('; ')}`} />}
      </span>
      {showOutcome && <OutcomePill outcome={row.outcome} label={row.outcome_label} />}
    </span>
  );
};

export const applicationColumns: TableColumn<LoanApplicationRow>[] = [
  {
    id: 'submitted',
    name: 'Submitted',
    cell: row => <CellText>{formatSubmitted(row.submitted_at)}</CellText>,
    hide: HIDE_BELOW_TABLET,
  },
  {
    id: 'name',
    name: 'Name',
    cell: row => <NameCell row={row} />,
  },
  {
    id: 'mobile',
    name: 'Mobile',
    cell: row => <CellText>{row.contact_no ?? ''}</CellText>,
    hide: HIDE_ON_PHONE,
  },
  {
    id: 'branch',
    name: 'Branch',
    cell: row => <BranchCell row={row} />,
  },
  {
    id: 'amount',
    name: 'Amount',
    right: true,
    cell: row => <CellText>{formatAmount(row.amount_applied)}</CellText>,
    hide: HIDE_ON_PHONE,
  },
  {
    id: 'purpose',
    name: 'Purpose',
    cell: row => <CellText title={row.purpose ?? undefined}>{row.purpose ?? ''}</CellText>,
    hide: HIDE_BELOW_LAPTOP,
  },
  {
    id: 'status',
    name: 'Status',
    cell: row => <StatusCell row={row} />,
  },
];
