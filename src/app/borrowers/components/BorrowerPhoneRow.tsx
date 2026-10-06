"use client";

import React from 'react';
import PayerBadge from '@/components/PayerBadge';
import type { BorrowerRowInfo } from '@/utils/DataTypes';
import { borrowerListName } from './borrowerName';

interface Props {
  row: BorrowerRowInfo;
  /** Hidden for a user with one branch: every row would say the same thing. */
  showBranch: boolean;
  pendingDeletion: boolean;
}

/**
 * One borrower on a phone (B1), drawn inside the shared table's row link (CustomDatatable
 * mobileRow), so it is plain content only: the Payer pill WITHOUT its Problem link, no pencil, no
 * trash (Delete lives in the borrower page's More menu).
 *   line 1: DELA CRUZ, JUAN M. -- up to two lines, broken at spaces only;
 *   line 2: the Payer pill, the branch, the date of birth, and a pending deletion if there is one.
 */
const BorrowerPhoneRow: React.FC<Props> = ({ row, showBranch, pendingDeletion }) => {
  const branch = row.branch_sub ?? row.borrower_work_background?.area?.branch_sub;
  const dob = row.borrower_details?.dob;

  return (
    <div className="min-w-0">
      <p className="line-clamp-2 break-normal font-semibold uppercase leading-snug text-black dark:text-white">
        {borrowerListName(row)}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-body dark:text-bodydark">
        <PayerBadge standing={row.payer_standing} />
        {showBranch && branch?.name && <span>{branch.name}</span>}
        {dob && <span><span className="sr-only">Born </span>{dob}</span>}
        {pendingDeletion && <span className="font-medium text-danger">Deletion pending</span>}
      </p>
    </div>
  );
};

export default BorrowerPhoneRow;
