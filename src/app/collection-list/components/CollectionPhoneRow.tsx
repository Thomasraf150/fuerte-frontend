import React from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import type { DataColListRow } from '@/utils/DataTypes';

/**
 * One scheduled collection on a phone, drawn INSIDE the shared table's row button (plain content
 * only). The list has no money column, so there is no amount: description, ref and dates, then
 * the Posted / Pending badge (same tones as the table).
 */
const CollectionPhoneRow: React.FC<{ row: DataColListRow }> = ({ row }) => (
  <div className="min-w-0">
    <p className="line-clamp-2 break-normal font-semibold uppercase leading-snug text-black dark:text-white">
      {row.description.slice(0, 35)}
    </p>
    <p className="mt-1 text-sm text-body dark:text-bodydark">
      {row.loan_ref}
      <span aria-hidden="true"> &middot; </span>
      <span className="sr-only">, </span>
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
