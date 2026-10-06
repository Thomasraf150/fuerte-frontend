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
 * application, and so does Marketing (the Collection role), view only outside its own
 * branches (`can_edit`); other branch staff see only those assigned to the branches
 * they can access.
 *
 * The header bell's Applications items are GraphQL too (getApplicationNotifications).
 */
const GET_LOAN_APPLICATIONS_QUERY: string = `
  query GetLoanApplications(
    $first: Int
    $page: Int
    $search: String
    $status: String
    $outcome: String
    $from: String
    $to: String
  ) {
    getLoanApplications(
      first: $first
      page: $page
      search: $search
      status: $status
      outcome: $outcome
      from: $from
      to: $to
    ) {
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
        outcome
        outcome_label
        decline_reason
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
 * Where the application ended up and the Notes panel's lines (the decline and the borrower's latest
 * decision, each with the actor's role, never a name). Shared by the whole record and the status
 * change's reply, so a decline shows its note the moment it is saved.
 */
const OUTCOME_AND_NOTES_FIELDS: string = `
  outcome
  outcome_label
  decline_reason
  notes {
    kind
    role_label
    at
    reason
  }
`;

/**
 * Every field of a LoanApplicationRecord, shared by the read and the save so the two
 * can never ask for different things: the list's columns, the ids, whether the user may
 * edit it (can_edit), the borrower's latest Approved / Rejected decision once it is a
 * borrower, the stored form's six groups (details) and the Google Form's answers, in the
 * order they were asked.
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
  can_edit
  borrower_decision {
    status
    reason
    decided_at
  }
  ${OUTCOME_AND_NOTES_FIELDS}
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

/**
 * `status` is one of for_interview, interviewed or declined. `reason` is required for declined (at
 * most 500 characters) and is not sent for the others: the server clears it when the status leaves
 * declined.
 */
const SET_LOAN_APPLICATION_STATUS_MUTATION: string = `
  mutation SetLoanApplicationStatus($id: Int!, $status: String!, $reason: String) {
    setLoanApplicationStatus(id: $id, status: $status, reason: $reason) {
      id
      status
      borrower_id
      ${OUTCOME_AND_NOTES_FIELDS}
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
 * Call Center gets it too: it has no branches, so every match is "elsewhere". "Application not
 * found." for an application the user cannot see.
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

/** The counts every funnel group carries: the four steps, the exits, the waiting stages and the exceptions. */
const FUNNEL_COUNT_FIELDS: string = `
  applied
  became_borrower
  approved
  loan_released
  declined
  rejected
  loan_cancelled
  for_interview
  interviewed
  borrower
  approved_no_loan
  loan_in_process
  rejected_with_loan
  released_without_approval
  borrower_deleted
`;

/**
 * The applicant funnel for the days applied between `from` and `to` (Y-m-d, both inclusive), over
 * all of them and per Saan galing channel. Same period rules and scope as the source counts. Stages
 * only: never amounts, loan refs or borrower records.
 */
const GET_APPLICATION_FUNNEL_QUERY: string = `
  query GetApplicationFunnel($from: String!, $to: String!) {
    getApplicationFunnel(from: $from, to: $to) {
      total {
        ${FUNNEL_COUNT_FIELDS}
      }
      by_channel {
        channel
        counts {
          ${FUNNEL_COUNT_FIELDS}
        }
      }
    }
  }
`;

/**
 * The header bell's Applications items. The server decides who gets what: Processing gets "now a
 * borrower" on its own branches, Call Center every status change and every Approved / Rejected on a
 * borrower made from an application, everyone else nothing. The last 7 days, never the user's own
 * action, newest first, at most 20.
 */
const GET_APPLICATION_NOTIFICATIONS: string = `
  query GetApplicationNotifications {
    getApplicationNotifications {
      key
      kind
      application_id
      borrower_id
      full_name
      branch_name
      status
      reason
      at
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
  GET_APPLICATION_FUNNEL_QUERY,
  GET_APPLICATION_NOTIFICATIONS,
};

export default LoanApplicationQueries;
