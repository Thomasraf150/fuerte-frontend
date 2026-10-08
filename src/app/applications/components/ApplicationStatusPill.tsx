import React from 'react';
import { LoanApplicationStatus } from '@/utils/DataTypes';

/** The four statuses in workflow order. The status filter and the row pill share these words. */
export const APPLICATION_STATUS_LABEL: Record<LoanApplicationStatus, string> = {
  for_interview: 'For Interview',
  interviewed: 'Interviewed',
  declined: 'Declined',
  borrower_created: 'Borrower created',
};

/** One committed colour per status. The filter swatches reuse it so the two always agree. */
export const APPLICATION_STATUS_DOT: Record<LoanApplicationStatus, string> = {
  for_interview: 'bg-warning',
  interviewed: 'bg-primary',
  declined: 'bg-danger',
  borrower_created: 'bg-body',
};

/*
 * The colour lives in the tint, the ring and the dot. The label stays black or
 * white: `warning` text on its own tint measures about 2:1 and `success` about
 * 3.4:1 at text-xs, both below WCAG AA. PayerBadge hit the same wall with
 * `success`. Tokens only, because the red-* and gray-* shades are dead in this
 * Tailwind config.
 */
const TINT: Record<LoanApplicationStatus, string> = {
  for_interview: 'bg-warning/15 ring-warning/50',
  interviewed: 'bg-primary/10 ring-primary/40',
  declined: 'bg-danger/10 ring-danger/40',
  borrower_created: 'bg-whiten ring-stroke dark:bg-meta-4 dark:ring-strokedark',
};

/*
 * data-tag="allowRowEvents" makes a click on the pill, or on the flag mark below, open
 * the row in the Applications list: see CellText in ApplicationColumns. Its dot and
 * label let clicks through to it (pointer-events-none), and the pill's own tooltip
 * still shows. Anywhere else the pill is shown the attribute does nothing.
 */
const ApplicationStatusPill: React.FC<{ status: LoanApplicationStatus }> = ({ status }) => {
  const label = APPLICATION_STATUS_LABEL[status] ?? status;
  return (
    <span
      data-tag="allowRowEvents"
      title={label}
      className={`inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-xs font-medium text-black ring-1 ring-inset dark:text-white sm:px-2.5 ${
        TINT[status] ?? 'bg-whiten ring-stroke dark:bg-meta-4 dark:ring-strokedark'
      }`}
    >
      {/*
        On phones three columns share the table, which fits only through the app-wide
        table-fit settings (useDatatableTheme's tableWrapper display:block) and the
        library's 100px column default (3 x 101px in a 302px table). The dot and some
        padding give their width back to the label.
      */}
      <span aria-hidden="true" className={`pointer-events-none hidden h-1.5 w-1.5 shrink-0 rounded-full sm:inline-block ${APPLICATION_STATUS_DOT[status] ?? 'bg-body'}`} />
      {/* A narrow column ellipsizes the label rather than clipping the pill. */}
      <span className="pointer-events-none min-w-0 overflow-hidden text-ellipsis">{label}</span>
    </span>
  );
};

/**
 * The intake-flag mark: an amber disc with a black "!". Its shape and glyph carry
 * the meaning, so it is never colour-only (black on `warning` is about 8:1).
 * Given a `label`, it is an image with that name and a matching tooltip. Without
 * one it is decoration beside a heading that already says it.
 */
export const IntakeFlagMark: React.FC<{ label?: string }> = ({ label }) => (
  <span
    data-tag="allowRowEvents"
    {...(label ? { role: 'img', 'aria-label': label, title: label } : { 'aria-hidden': true })}
    className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-warning text-[10px] font-bold leading-none text-black"
  >
    !
  </span>
);

export default ApplicationStatusPill;
