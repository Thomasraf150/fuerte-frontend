// Move a borrower to another branch (backend graphql/borrowermove.graphql).

const SUMMARY_FIELDS = `
  borrower_id
  borrower_name
  mode
  refusal
  loans_to_move
  applications_to_move
  current_branch { id name group_name }
  destinations { id name group_name }
  open_loans { loan_id loan_ref branch_name balance }
  open_balance
  history { kind other_borrower_id from_branch to_branch reason moved_by moved_at loans_moved applications_moved }
`;

const BORROWER_MOVE_SUMMARY: string = `
  query BorrowerMoveSummary($borrower_id: Int!) {
    borrowerMoveSummary(borrower_id: $borrower_id) { ${SUMMARY_FIELDS} }
  }
`;

const BORROWER_MOVE_AREAS: string = `
  query BorrowerMoveAreas($borrower_id: Int!, $branch_sub_id: Int!) {
    borrowerMoveAreas(borrower_id: $borrower_id, branch_sub_id: $branch_sub_id) {
      id
      name
      sub_areas { id name }
    }
  }
`;

const MOVE_BORROWER_BRANCH: string = `
  mutation MoveBorrowerBranch($borrower_id: Int!, $branch_sub_id: Int!, $area_id: Int!, $sub_area_id: Int, $reason: String) {
    moveBorrowerBranch(borrower_id: $borrower_id, branch_sub_id: $branch_sub_id, area_id: $area_id, sub_area_id: $sub_area_id, reason: $reason) {
      ${SUMMARY_FIELDS}
    }
  }
`;

const COPY_BORROWER_TO_BRANCH: string = `
  mutation CopyBorrowerToBranch($borrower_id: Int!, $branch_sub_id: Int!, $area_id: Int!, $sub_area_id: Int, $reason: String) {
    copyBorrowerToBranch(borrower_id: $borrower_id, branch_sub_id: $branch_sub_id, area_id: $area_id, sub_area_id: $sub_area_id, reason: $reason) {
      borrower_id
      branch { id name group_name }
    }
  }
`;

const BorrowerMoveQueries = { BORROWER_MOVE_SUMMARY, BORROWER_MOVE_AREAS, MOVE_BORROWER_BRANCH, COPY_BORROWER_TO_BRANCH };

export default BorrowerMoveQueries;
