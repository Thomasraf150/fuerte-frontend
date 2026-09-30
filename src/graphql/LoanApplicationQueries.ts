/**
 * Loan applications — the /applications list, and New application (/applications/new).
 *
 * The list, New application's branch choices and saving a typed-in application are
 * GraphQL. The Google Form upload is REST (POST /api/applications/upload, see
 * useLoanApplications) because it carries a file, and this app's GraphQL Upload
 * scalar is a no-op pass-through.
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
        channel
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

/**
 * New application's branch picker: every branch for Call Center, Owner and Admin,
 * otherwise the branches the user can access. Ids and names only.
 */
const GET_APPLICATION_BRANCHES_QUERY: string = `
  query GetApplicationBranches {
    getApplicationBranches {
      id
      name
    }
  }
`;

/** Saves a typed-in application. `input` is built by toApplicationInput (src/utils/applicationForm.ts). */
const CREATE_LOAN_APPLICATION_MUTATION: string = `
  mutation CreateLoanApplication($input: LoanApplicationInput!) {
    createLoanApplication(input: $input) {
      id
    }
  }
`;

const LoanApplicationQueries = {
  GET_LOAN_APPLICATIONS_QUERY,
  GET_APPLICATION_BRANCHES_QUERY,
  CREATE_LOAN_APPLICATION_MUTATION,
};

export default LoanApplicationQueries;
