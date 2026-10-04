/**
 * Loan applications — the /applications list, and New application (/applications/new).
 *
 * The list, New application's branch choices and saving a typed-in application are
 * GraphQL. The Google Form upload is REST (POST /api/applications/upload, see
 * useLoanApplications) because it carries a file, and this app's GraphQL Upload
 * scalar is a no-op pass-through.
 *
 * One application's page (/applications/[id]) is GraphQL too: reading it, saving an
 * edit, setting its status and printing it. The per-channel counts for a date range
 * are GraphQL as well.
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

/**
 * Every field of a LoanApplicationRecord, shared by the read and the save so the two
 * can never ask for different things: the list's columns, the ids, the stored form's
 * six groups (details) and the Google Form's answers, in the order they were asked.
 */
const LOAN_APPLICATION_RECORD_FIELDS: string = `
  id
  source
  channel
  submitted_at
  location
  branch_sub_id
  branch_sub {
    id
    name
  }
  status
  borrower_id
  full_name
  contact_no
  amount_applied
  purpose
  intake_flags
  created_at
  exact_time
  details {
    info {
      firstname
      middlename
      lastname
      amount_applied
      purpose
      chief_id
      terms_of_payment
      residence_address
      is_rent
      other_source_of_inc
      est_monthly_fam_inc
      employment_position
      gender
    }
    detail {
      contact_no
      email
      dob
      place_of_birth
      age
      civil_status
    }
    spouse {
      work_address
      occupation
      fullname
      company
      dept_branch
      length_of_service
      salary
      company_contact_person
      contact_no
    }
    work {
      company_borrower_id
      employment_number
      area_id
      sub_area_id
      station
      term_in_service
      employment_status
      division
      monthly_gross
      monthly_net
      office_address
    }
    company {
      employer
      salary
      contract_duration
    }
    references {
      occupation
      name
      contact_no
    }
  }
  form_answers {
    question
    answer
  }
`;

/** One application, whole: what /applications/[id] opens on. */
const GET_LOAN_APPLICATION_QUERY: string = `
  query GetLoanApplication($id: Int!) {
    getLoanApplication(id: $id) {
      ${LOAN_APPLICATION_RECORD_FIELDS}
    }
  }
`;

/** Saves an edit. `input` is built by toApplicationUpdateInput (src/utils/applicationForm.ts). */
const UPDATE_LOAN_APPLICATION_MUTATION: string = `
  mutation UpdateLoanApplication($id: Int!, $input: LoanApplicationUpdateInput!) {
    updateLoanApplication(id: $id, input: $input) {
      ${LOAN_APPLICATION_RECORD_FIELDS}
    }
  }
`;

/** `status` is one of for_interview, interviewed or declined. */
const SET_LOAN_APPLICATION_STATUS_MUTATION: string = `
  mutation SetLoanApplicationStatus($id: Int!, $status: String!) {
    setLoanApplicationStatus(id: $id, status: $status) {
      id
      status
      borrower_id
    }
  }
`;

/** Prints one application as a PDF; the result is the PDF's relative link. */
const PRINT_LOAN_APPLICATION_MUTATION: string = `
  mutation PrintLoanApplication($application_id: Int!) { printLoanApplication(application_id: $application_id) }
`;

/**
 * Whether the applicant already has a borrower in Fuerte: the New Borrower name check, run on the
 * server from the stored application's first and last name and mobile number, across all branches.
 * `my*` is the user's own branches (names and count); the rest is the other branches, by name only.
 * Null for Call Center; "Application not found." for an application the user cannot see.
 */
const GET_LOAN_APPLICATION_BORROWER_MATCH_QUERY: string = `
  query GetLoanApplicationBorrowerMatch($id: Int!) {
    getLoanApplicationBorrowerMatch(id: $id) {
      existsInMyBranches
      myBranches
      myBranchMatchCount
      myBranchIsProblem
      myBranchWorstCutoffs
      existsElsewhere
      branches
      isProblem
      worstCutoffsMissed
    }
  }
`;

/** How many applications came in by each channel between two days. `from` and `to` are Y-m-d. */
const GET_APPLICATION_SOURCE_COUNTS_QUERY: string = `
  query GetApplicationSourceCounts($from: String!, $to: String!) {
    getApplicationSourceCounts(from: $from, to: $to) {
      channel
      count
    }
  }
`;

const LoanApplicationQueries = {
  GET_LOAN_APPLICATIONS_QUERY,
  GET_APPLICATION_BRANCHES_QUERY,
  CREATE_LOAN_APPLICATION_MUTATION,
  GET_LOAN_APPLICATION_QUERY,
  UPDATE_LOAN_APPLICATION_MUTATION,
  SET_LOAN_APPLICATION_STATUS_MUTATION,
  PRINT_LOAN_APPLICATION_MUTATION,
  GET_LOAN_APPLICATION_BORROWER_MATCH_QUERY,
  GET_APPLICATION_SOURCE_COUNTS_QUERY,
};

export default LoanApplicationQueries;
