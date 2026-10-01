"use client";

import React from 'react';
import { TableColumn } from 'react-data-table-component';
import { LoanApplicationRow } from '@/utils/DataTypes';
import { CHANNEL_SHORT_LABELS } from '@/utils/applicationForm';
import { formatMoneyOrBlank } from '@/utils/helper';
import ApplicationStatusPill, { IntakeFlagMark } from './ApplicationStatusPill';
import { CHANNEL_ICONS } from './channelIcons';

/*
 * `hide` removes a column at viewport widths up to and including the number.
 * These breakpoints rely on the app-wide table-fit settings: useDatatableTheme's
 * `tableWrapper` display:block, which sizes a table to its container rather than
 * its content, plus the 80px column floor in app/styles.css. With those and
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
const formatSubmitted = (value: string | null): string => {
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
 */
const CellText: React.FC<{ children: React.ReactNode; title?: string; className?: string }> = ({
  children,
  title,
  className = '',
}) => (
  <span title={title} className={`min-w-0 overflow-hidden text-ellipsis ${className}`}>
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

/**
 * The name, and under it where the application came from (Saan galing): the
 * source's icon and short label, muted. No coloured dot: dots mean status on this
 * page. A row without a channel shows the name alone.
 */
const NameCell: React.FC<{ row: LoanApplicationRow }> = ({ row }) => {
  const channel = row.channel && row.channel in CHANNEL_SHORT_LABELS ? row.channel : null;
  const ChannelIcon = channel ? CHANNEL_ICONS[channel] : null;
  return (
    <span className="flex min-w-0 flex-col">
      <CellText title={row.full_name} className="font-medium text-black dark:text-white">
        {row.full_name}
      </CellText>
      {channel && ChannelIcon && (
        <span className="flex min-w-0 items-center gap-1 text-xs text-body dark:text-bodydark">
          <ChannelIcon aria-hidden="true" size={12} className="shrink-0" />
          <CellText>
            <span className="sr-only">Saan galing: </span>
            {CHANNEL_SHORT_LABELS[channel]}
          </CellText>
        </span>
      )}
    </span>
  );
};

const StatusCell: React.FC<{ row: LoanApplicationRow }> = ({ row }) => {
  const flags = row.intake_flags ?? [];
  return (
    <span className="flex min-w-0 items-center gap-1 sm:gap-1.5">
      <ApplicationStatusPill status={row.status} />
      {flags.length > 0 && <IntakeFlagMark label={`Check: ${flags.join('; ')}`} />}
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
