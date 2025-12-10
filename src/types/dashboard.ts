/**
 * Dashboard Type Definitions
 *
 * These types match the GraphQL schema defined in:
 * fuerte-api/graphql/dashboard.graphql
 */

export interface BranchInfo {
  branch_id: number | null;
  branch_name: string;
}

export interface AccountingDashboardSummary {
  total_nr: string;
  total_udi: string;
  total_outstanding: string;
  active_loan_count: string;
  nr_change_percent: string;
  udi_change_percent: string;
  loan_count_change_percent: string;
  outstanding_change_percent: string;
}

export interface PreviousPeriodSummary {
  total_nr: string;
  total_udi: string;
  total_outstanding: string;
  active_loan_count: string;
}

export interface NrUdiTrend {
  month: string;
  nr_total: string;
  udi_total: string;
}

export interface SubBranchBreakdown {
  branch_sub_id: number;
  branch_sub_name: string;
  loan_count: number;
  nr_balance: string;
  udi_balance: string;
}

export interface AccountingDashboard {
  viewing_branch: BranchInfo;
  summary: AccountingDashboardSummary;
  previous: PreviousPeriodSummary;
  trend: NrUdiTrend[];
  sub_branch_breakdown: SubBranchBreakdown[];
}

export type PeriodOption = '1month' | '3months' | '6months' | '12months' | 'custom';

export interface DashboardFilters {
  period: PeriodOption;
  branchId: number | null;
}
