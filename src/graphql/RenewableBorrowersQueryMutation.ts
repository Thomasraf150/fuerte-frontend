const GET_RENEWABLE_BORROWERS: string = `
  query GetRenewableBorrowers($input: InputRenewableBorrower){
    getRenewableBorrowers(input: $input) {
      data {
        borrower_id
        borrower_name
        branch_name
        sub_branch_name
        renewable_loan_count
        total_pn_amount
        latest_released_date
        is_problem
        problem_cutoffs
        problem_shortfall
      }
      summary {
        total_renewable_borrowers
        total_problem_on_page
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

const RenewableBorrowersQueryMutation = {
  GET_RENEWABLE_BORROWERS,
};

export default RenewableBorrowersQueryMutation;
