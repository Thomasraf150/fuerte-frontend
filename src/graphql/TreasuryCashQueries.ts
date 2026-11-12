/** The Treasury cash report (claude-docs/treasury-cash-report.md). Amounts are 2-decimal strings. */
export const TREASURY_CASH_REPORT = `
  query TreasuryCashReport($month: String!, $cutoff: String!, $branch_sub_id: ID) {
    treasuryCashReport(month: $month, cutoff: $cutoff, branch_sub_id: $branch_sub_id) {
      month cutoff start_date end_date label
      lines { number account_name beginning deposits disbursements transfers ending }
      total { beginning deposits disbursements transfers ending }
    }
  }
`;

export type TreasuryCutoff = 'whole' | 'first' | 'second';

export interface TreasuryCashAmounts {
  beginning: string;
  deposits: string;
  disbursements: string;
  transfers: string;
  ending: string;
}

export interface TreasuryCashLine extends TreasuryCashAmounts {
  number: string;
  account_name: string;
}

export interface TreasuryCashReport {
  month: string;
  cutoff: TreasuryCutoff;
  start_date: string;
  end_date: string;
  label: string;
  lines: TreasuryCashLine[];
  total: TreasuryCashAmounts;
}
