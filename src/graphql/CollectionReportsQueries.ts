/** Collection efficiency, release status and the Daily Income Statement (backend graphql/collectionreports.graphql). */

const FIGURES = `due paid_on_time paid_to_date unpaid percent_on_time percent_to_date schedules borrowers`;

export const COLLECTION_EFFICIENCY = `
  query CollectionEfficiency($month: String!) {
    collectionEfficiency(month: $month) {
      month label from to on_time_as_of threshold
      total { ${FIGURES} }
      by_branch { group_code branch_name branch_sub_id branch_sub_name ${FIGURES} }
      by_company { company_id company_name ${FIGURES} }
    }
  }
`;

const PENDING = `loan_id loan_ref borrower_id branch_sub_id borrower_name branch_sub_name loan_proceeds person_status
  company_id company_name company_status overdue_loan_id may_release reason hold`;
const COMPANY = `company_id company_name cutoff_label threshold due paid percent status borrowers`;

export const RELEASE_STATUS = `
  query ReleaseStatus {
    releaseStatus {
      cutoff_label threshold
      pending_truncated
      pending { ${PENDING} }
      companies { ${COMPANY} }
    }
  }
`;

export const EMPLOYER_STANDING = `
  query EmployerStanding($company_id: ID!) {
    employerStanding(company_id: $company_id) {
      company { ${COMPANY} }
      amount_to_green
      borrowers { borrower_id borrower_name loan_id branch_sub_name due paid short }
      borrowers_elsewhere
      pending { ${PENDING} }
    }
  }
`;

const SECTION = `lines { number account_name day month_to_date } day month_to_date`;
const TOTALS = `total_income net_before_other net_before_tax net_income`;

export const DAILY_INCOME_STATEMENT = `
  query DailyIncomeStatement($date: String!, $branch_sub_id: ID) {
    dailyIncomeStatement(date: $date, branch_sub_id: $branch_sub_id) {
      day label month_label
      sections {
        interest_income { ${SECTION} } other_revenues { ${SECTION} } direct_financing { ${SECTION} }
        other_income_expense { ${SECTION} } expenses { ${SECTION} } income_tax { ${SECTION} }
      }
      totals { day { ${TOTALS} } month_to_date { ${TOTALS} } }
      ticket { loans_released release_income { description amount } release_income_total earned_interest interest_difference collection }
    }
  }
`;

export interface EfficiencyFigures {
  due: string; paid_on_time: string; paid_to_date: string; unpaid: string;
  percent_on_time: string; percent_to_date: string; schedules: number; borrowers: number;
}
export interface EfficiencyBranchRow extends EfficiencyFigures { group_code: string | null; branch_name: string | null; branch_sub_id: string; branch_sub_name: string }
export interface EfficiencyCompanyRow extends EfficiencyFigures { company_id: string | null; company_name: string }
export interface CollectionEfficiency {
  month: string; label: string; from: string; to: string; on_time_as_of: string; threshold: string;
  total: EfficiencyFigures; by_branch: EfficiencyBranchRow[]; by_company: EfficiencyCompanyRow[];
}

export type Standing = 'red' | 'green' | 'new' | 'none';
export interface PendingRelease {
  loan_id: string; loan_ref: string | null; borrower_name: string; branch_sub_name: string; loan_proceeds: string;
  person_status: Standing; company_name: string | null; company_status: Standing | null; may_release: boolean; reason: string | null;
  /** Which check holds it, for the short reason: null when it may go out. */
  hold: 'eligibility' | 'branch' | 'borrower' | 'employer' | null;
  borrower_id: string; branch_sub_id: string; company_id: string | null;
  /** For a borrower in the red: the loan whose overdue amortization a payment goes to. */
  overdue_loan_id: string | null;
}
export interface CompanyStanding {
  company_id: string; company_name: string; cutoff_label: string; threshold: string; due: string; paid: string;
  percent: string; status: Standing; borrowers: number;
}
export interface EmployerBorrower { borrower_id: string; borrower_name: string; loan_id: string; branch_sub_name: string; due: string; paid: string; short: string }
export interface EmployerStanding {
  company: CompanyStanding; amount_to_green: string; borrowers: EmployerBorrower[]; borrowers_elsewhere: number; pending: PendingRelease[];
}
export interface ReleaseStatus { cutoff_label: string; threshold: string; pending: PendingRelease[]; pending_truncated: boolean; companies: CompanyStanding[] }

export interface DailyIncomeLine { number: string; account_name: string; day: string; month_to_date: string }
export interface DailyIncomeSection { lines: DailyIncomeLine[]; day: string; month_to_date: string }
export type DailyIncomeSectionKey = 'interest_income' | 'other_revenues' | 'direct_financing' | 'other_income_expense' | 'expenses' | 'income_tax';
export interface DailyIncomeTotalsCol { total_income: string; net_before_other: string; net_before_tax: string; net_income: string }
export interface DailyIncomeStatement {
  day: string; label: string; month_label: string;
  sections: Record<DailyIncomeSectionKey, DailyIncomeSection>;
  totals: { day: DailyIncomeTotalsCol; month_to_date: DailyIncomeTotalsCol };
  ticket: { loans_released: number; release_income: { description: string; amount: string }[]; release_income_total: string; earned_interest: string; interest_difference: string; collection: string } | null;
}
