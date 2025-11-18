/**
 * Chart of Accounts Type Definitions
 *
 * These types match the GraphQL schema defined in:
 * fuerte-api/graphql/chartofaccounts.graphql
 */

export interface Account {
  id: string;
  user_id?: string;
  branch_sub_id?: string;
  account_name: string;
  number: string;
  description?: string;
  balance: string;
  is_debit: string;
  is_active: boolean;
  parent_account_id?: string;
  created_at?: string;
  updated_at?: string;
  // Relationships
  branch_sub?: BranchSub;
  subAccounts?: Account[];
}

export interface BranchSub {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
}

export interface AccountDetail {
  id: string;
  user_id?: string;
  branch_sub_id?: string;
  account_name: string;
  description?: string;
  number: string;
  balance: string;
  is_debit: string;
  is_active: boolean;
  parent_account_id?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  parent?: Account | null;
  subAccounts: Account[];
  branch_sub?: BranchSub | null;
  created_by?: User | null;
  // Computed fields
  transaction_count: number;
  has_transactions: boolean;
}

export interface AccountTransaction {
  id: string;
  journal_ref: string;
  journal_name: string;
  journal_type: string;
  journal_date: string;
  posted_date?: string | null;
  journal_desc?: string | null;
  document_no?: string | null;
  check_no?: string | null;
  debit: string;
  credit: string;
  running_balance: string;
  is_posted: boolean;
  is_cancelled: boolean;
  posted_by_name?: string | null;
  vendor_name?: string | null;
  borrower_name?: string | null;
}

export interface AccountTransactionsResponse {
  transactions: AccountTransaction[];
  total_count: number;
  beginning_balance: string;
  ending_balance: string;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  journalType?: string;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface AccountDetailPageParams {
  id: string;
}
