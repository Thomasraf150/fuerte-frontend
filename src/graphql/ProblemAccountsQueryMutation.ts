const GET_PROBLEM_ACCOUNTS: string = `
  query GetProblemAccounts($input: InputProblemAccount){
    getProblemAccounts(input: $input) {
      data {
        loan_id
        loan_ref
        borrower_name
        branch_name
        sub_branch_name
        pn_amount
        cumulative_scheduled
        cumulative_collected
        ua_amount
        sp_amount
        shortfall
        oldest_unpaid_due_date
        oldest_unpaid_schedule_id
        days_past_due
      }
      summary {
        total_problem_accounts
        total_shortfall
        total_ua_amount
        total_sp_amount
      }
      pagination {
        currentBatch
        totalBatches
        batchStartPage
        batchEndPage
        totalRecords
        hasNextBatch
        perPage
        currentPage
      }
    }
  }
`;

const ProblemAccountsQueryMutation = {
  GET_PROBLEM_ACCOUNTS,
};

export default ProblemAccountsQueryMutation;
