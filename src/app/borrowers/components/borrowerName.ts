import type { BorrowerRowInfo } from '@/utils/DataTypes';

/** "DELA CRUZ, JUAN M.": last name, first name, middle initial (the list draws it in capitals). */
export function borrowerListName(row: Pick<BorrowerRowInfo, 'firstname' | 'middlename' | 'lastname'>): string {
  const last = (row.lastname ?? '').trim();
  const first = (row.firstname ?? '').trim();
  const initial = (row.middlename ?? '').trim().charAt(0);
  const given = initial ? `${first} ${initial}.` : first;
  return [last, given].filter(Boolean).join(', ');
}
