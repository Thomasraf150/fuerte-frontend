/**
 * Loan applications — the /applications list.
 *
 * Only the list is GraphQL. The Google Form upload is REST
 * (POST /api/applications/upload, see useLoanApplications) because it carries a
 * file, and this app's GraphQL Upload scalar is a no-op pass-through.
 *
 * Visibility is decided server-side: Owner, Admin and Call Center see every
 * application; branch staff see only those assigned to the branches they can access.
 */
const GET_LOAN_APPLICATIONS_QUERY: string = `
  query GetLoanApplications($first: Int, $page: Int, $search: String, $status: String) {
    getLoanApplications(first: $first, page: $page, search: $search, status: $status) {
      data {
        id
        source
        submitted_at
        location
        branch_sub {
          id
          name
        }
        status
        full_name
        contact_no
        amount_applied
        purpose
        intake_flags
      }
      paginatorInfo {
        total
        currentPage
        lastPage
        hasMorePages
      }
    }
  }
`;

const LoanApplicationQueries = {
  GET_LOAN_APPLICATIONS_QUERY,
};

export default LoanApplicationQueries;
