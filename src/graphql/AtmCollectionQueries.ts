/** ATM collection lists, refunds, notices and the OPEX fund (backend graphql/atmcollections.graphql). */

const BATCH_FIELDS = `id branch_sub_id branch_sub_name batch_no collection_date cutoff_start cutoff_end cutoff_label status prepared_by_name checked_by_name noted_by_name posted_at`;
const RATE_FIELDS = `due collected percent is_green threshold amount_to_green`;

export const ATM_BATCHES = `
  query AtmBatches($branch_sub_id: ID, $page: Int, $first: Int) {
    atmCollectionBatches(branch_sub_id: $branch_sub_id, page: $page, first: $first) {
      data { ${BATCH_FIELDS} }
      paginatorInfo { currentPage lastPage total }
    }
  }
`;

export const ATM_SHEET = `
  query AtmSheet($id: ID!) {
    atmCollectionSheet(id: $id) {
      batch { ${BATCH_FIELDS} }
      rows {
        borrower_id borrower_name loan_refs amort_due ua_open penalty_open
        swipes { id seq amount balance_inquiry pos_charge gprs_charge amort ua_payment penalty refund }
        atm_collection amort_paid ua_sp ua_payment penalty pos_charge gprs_charge refund
        fully_paid refund_method refund_account_no posted journal_refs refund_status status
      }
      totals { amort_due atm_collection amort_paid ua_sp ua_payment penalty pos_charge gprs_charge refund }
      rate { ${RATE_FIELDS} }
    }
  }
`;

export const ATM_BRANCH_STATUSES = `
  query AtmBranchStatuses {
    atmBranchStatuses {
      branch_sub_id branch_sub_name latest_batch_id latest_batch_no latest_status
      rate { ${RATE_FIELDS} batch_no cutoff_start }
      monthly { month due collected percent is_green }
    }
  }
`;

export const ATM_REFUNDS = `
  query AtmRefunds($status: String) {
    atmRefunds(status: $status) {
      id batch_id borrower_id borrower_name branch_sub_id branch_sub_name batch_no collection_date
      refund refund_method refund_account_no refund_status fully_paid released_at posted_at has_proof
    }
  }
`;

export const ATM_REFUND_PROOF = `query AtmRefundProof($id: ID!) { atmRefundProof(id: $id) }`;

export const ATM_FUNDS_REQUEST = `
  query AtmFundsRequest {
    atmFundsRequest { branch_sub_id branch_sub_name can_release rate_percent refunds loan_releases loan_release_count total }
  }
`;

export const MY_APP_NOTIFICATIONS = `
  query MyAppNotifications { myAppNotifications { id type title body link read_at created_at } }
`;

export const OPEX_LEDGER = `
  query OpexLedger($branch_sub_id: ID!, $month: String!) {
    branchOpexLedger(branch_sub_id: $branch_sub_id, month: $month) {
      month beginning replenished spent ending
      entries { id entry_date type category particulars amount source_account status running_balance }
    }
    opexCategories
  }
`;

export const OPEX_PENDING = `
  query OpexPending {
    opexPendingReplenishments { id branch_sub_id branch_sub_name entry_date amount source_account particulars requested_by_name }
  }
`;

const RESULT = `{ status message id }`;

export const CREATE_ATM_BATCH = `mutation ($branch_sub_id: ID!, $collection_date: String!) { createAtmCollectionBatch(branch_sub_id: $branch_sub_id, collection_date: $collection_date) ${RESULT} }`;
export const ADD_ATM_SWIPE = `mutation ($batch_id: ID!, $borrower_id: ID!, $amount: String!, $balance_inquiry: String) { addAtmSwipe(batch_id: $batch_id, borrower_id: $borrower_id, amount: $amount, balance_inquiry: $balance_inquiry) ${RESULT} }`;
export const REMOVE_ATM_SWIPE = `mutation ($batch_id: ID!, $swipe_id: ID!) { removeAtmSwipe(batch_id: $batch_id, swipe_id: $swipe_id) ${RESULT} }`;
export const SET_ATM_REFUND_METHOD = `mutation ($batch_id: ID!, $borrower_id: ID!, $method: String!, $account_no: String) { setAtmRefundMethod(batch_id: $batch_id, borrower_id: $borrower_id, method: $method, account_no: $account_no) ${RESULT} }`;
export const SIGN_ATM_BATCH = `mutation ($batch_id: ID!, $as: String!) { signAtmCollectionBatch(batch_id: $batch_id, as: $as) ${RESULT} }`;
export const POST_ATM_BATCH = `mutation ($batch_id: ID!) { postAtmCollectionBatch(batch_id: $batch_id) { status message posted failed { borrower message } } }`;
export const RELEASE_ATM_REFUND = `mutation ($line_id: ID!, $proof: String!) { releaseAtmRefund(line_id: $line_id, proof: $proof) ${RESULT} }`;
export const NOTIFY_OWNERS_FUNDS = `mutation ($branch_sub_id: ID!, $amount: String!) { notifyOwnersOfFundsRelease(branch_sub_id: $branch_sub_id, amount: $amount) ${RESULT} }`;
export const MARK_NOTICES_READ = `mutation ($id: ID) { markAppNotificationsRead(id: $id) ${RESULT} }`;
export const ADD_OPEX_EXPENSE = `mutation ($input: OpexExpenseInput!) { addOpexExpense(input: $input) ${RESULT} }`;
export const REQUEST_OPEX_REPLENISHMENT = `mutation ($input: OpexReplenishmentInput!) { requestOpexReplenishment(input: $input) ${RESULT} }`;
export const DECIDE_OPEX_REPLENISHMENT = `mutation ($id: ID!, $approve: Boolean!) { decideOpexReplenishment(id: $id, approve: $approve) ${RESULT} }`;

export interface AtmBatch {
  id: string; branch_sub_id: string; branch_sub_name: string | null; batch_no: number;
  collection_date: string; cutoff_start: string; cutoff_end: string; cutoff_label: string; status: 'draft' | 'posted';
  prepared_by_name: string | null; checked_by_name: string | null; noted_by_name: string | null; posted_at: string | null;
}
export interface AtmRate { due: string; collected: string; percent: string; is_green: boolean; threshold: string; amount_to_green: string }
export interface AtmSwipe {
  id: string; seq: number; amount: string; balance_inquiry: string | null; pos_charge: string | null; gprs_charge: string | null;
  amort: string | null; ua_payment: string | null; penalty: string | null; refund: string | null;
}
export interface AtmRow {
  borrower_id: string; borrower_name: string; loan_refs: string[]; amort_due: string; ua_open: string; penalty_open: string;
  swipes: AtmSwipe[]; atm_collection: string; amort_paid: string; ua_sp: string; ua_payment: string; penalty: string;
  pos_charge: string; gprs_charge: string; refund: string; fully_paid: boolean; refund_method: 'TOF' | 'ACCOUNT' | 'CASH';
  refund_account_no: string | null; posted: boolean; journal_refs: string[]; refund_status: string; status: 'not_swiped' | 'short' | 'paid' | 'nothing_due';
}
export type AtmTotals = Record<'amort_due' | 'atm_collection' | 'amort_paid' | 'ua_sp' | 'ua_payment' | 'penalty' | 'pos_charge' | 'gprs_charge' | 'refund', string>;
export interface AtmSheet { batch: AtmBatch; rows: AtmRow[]; totals: AtmTotals; rate: AtmRate }
export interface AtmBranchStatus {
  branch_sub_id: string; branch_sub_name: string; latest_batch_id: string | null; latest_batch_no: number | null; latest_status: string | null;
  rate: (AtmRate & { batch_no: number; cutoff_start: string }) | null;
  monthly: { month: string; due: string; collected: string; percent: string; is_green: boolean } | null;
}
export interface AtmRefund {
  id: string; batch_id: string; borrower_id: string; borrower_name: string; branch_sub_id: string; branch_sub_name: string;
  batch_no: number; collection_date: string; refund: string; refund_method: string; refund_account_no: string | null;
  refund_status: string; fully_paid: boolean; released_at: string | null; posted_at: string | null; has_proof: boolean;
}
export interface AtmFundsRow {
  branch_sub_id: string; branch_sub_name: string; can_release: boolean; rate_percent: string | null;
  refunds: string; loan_releases: string; loan_release_count: number; total: string;
}
export interface AppNotice { id: string; type: string; title: string; body: string; link: string | null; read_at: string | null; created_at: string }
export interface OpexEntry {
  id: string; entry_date: string; type: 'expense' | 'replenishment'; category: string; particulars: string; amount: string;
  source_account: string | null; status: 'posted' | 'pending' | 'declined'; running_balance: string | null;
}
export interface OpexLedger { month: string; beginning: string; replenished: string; spent: string; ending: string; entries: OpexEntry[] }
export interface OpexPending {
  id: string; branch_sub_id: string; branch_sub_name: string; entry_date: string; amount: string;
  source_account: string | null; particulars: string; requested_by_name: string;
}
export interface AtmResult { status: boolean; message: string; id: string | null }
