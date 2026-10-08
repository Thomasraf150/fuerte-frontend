import React from 'react';
import { LoanStatusBadge } from '@/components/StatusBadge';
import { formatNumber } from '@/utils/formatNumber';
import type { BorrLoanRowData } from '@/utils/DataTypes';

interface Props {
  row: BorrLoanRowData;
  /** Small extra text under the status, e.g. "Deletion pending". Plain text only. */
  note?: string;
}

/**
 * One loan on a phone (Phase 2-3), drawn INSIDE the shared table's row link or button
 * (CustomDatatable mobileRow), so plain content only: no link or button of its own.
 *   line 1: the borrower, bold, and the PN amount right-aligned (the figure the desktop list keeps
 *           when Loan Proceeds steps aside below 1440px);
 *   line 2: product · loan ref;
 *   line 3: the status badge.
 */
const LoanPhoneRow: React.FC<Props> = ({ row, note }) => {
  const name = row.borrower ? `${row.borrower.lastname ?? ''}, ${row.borrower.firstname ?? ''}` : '-';
  const pn = Number(row.pn_amount);
  return (
    <div className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-2 min-w-0 break-normal font-semibold uppercase leading-snug text-black dark:text-white">{name}</p>
        <p className="shrink-0 text-right font-semibold tabular-nums text-black dark:text-white">
          <span className="mr-1 text-xs font-medium text-body dark:text-bodydark">PN</span>
          {Number.isFinite(pn) ? formatNumber(pn) : ''}
        </p>
      </div>
      <p className="mt-1 break-words text-sm text-body dark:text-bodydark">
        {row.loan_product?.description}
        {row.loan_ref ? <> &middot; {row.loan_ref}</> : null}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <LoanStatusBadge status={row.custom_status} />
        {note && <span className="text-sm font-medium text-danger">{note}</span>}
      </p>
    </div>
  );
};

export default LoanPhoneRow;
