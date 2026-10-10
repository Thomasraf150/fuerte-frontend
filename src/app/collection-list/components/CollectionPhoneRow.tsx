import React from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import type { DataColListRow } from '@/utils/DataTypes';

/**
 * One scheduled collection on a phone, drawn INSIDE the shared table's row button (plain content
 * only). Same shape as LoanPhoneRow on the Loans and Payment Posting lists, so the three read alike:
 *   line 1: the borrower, bold (who paid: the row's identifier, as on desktop);
 *   line 2: loan ref · product;
 *   line 3: due and collected dates;
 *   line 4: the Posted / Pending badge (same tones as the table).
 * The list has no money column, so there is no amount.
 */
const CollectionPhoneRow: React.FC<{ row: DataColListRow }> = ({ row }) => (
  <div className="min-w-0">
    <p className="line-clamp-2 break-normal font-semibold uppercase leading-snug text-black dark:text-white">
      {row.borrower_name ?? '—'}
    </p>
    <p className="mt-1 break-words text-sm text-body dark:text-bodydark">
      <span className="tabular-nums">{row.loan_ref}</span>
      <span aria-hidden="true"> &middot; </span>
      <span className="sr-only">, </span>
      {row.description}
    </p>
    <p className="mt-0.5 text-sm text-body dark:text-bodydark">
      Due {row.due_date}
      <span aria-hidden="true"> &middot; </span>
      <span className="sr-only">, </span>
      Collected {row.trans_date}
    </p>
    <p className="mt-1">
      {row.journal_ref
        ? <StatusBadge tone="posted">Posted</StatusBadge>
        : <StatusBadge tone="pending">Pending</StatusBadge>}
    </p>
  </div>
);

export default CollectionPhoneRow;
