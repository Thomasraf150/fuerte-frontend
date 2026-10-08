const GET_BORROWER_QUERY: string = `
    query GetBorrowers($first: Int!, $page: Int!, $orderBy: [OrderByClause!], $search: String, $payer: PayerStanding){
      getBorrowers(first: $first, page: $page, orderBy: $orderBy, search: $search, payer: $payer) {
        data {
          id
          payer_standing
          user_id
          chief_id
          amount_applied
          purpose
          firstname
          middlename
          lastname
          terms_of_payment
          residence_address
          is_rent
          other_source_of_inc
          est_monthly_fam_inc
          employment_position
          gender
          photo
          is_deleted
          chief {
            id
            name
          }
          borrower_details {
            id
            dob
            place_of_birth
            age
            email
            contact_no
            civil_status
          }
          borrower_spouse_details {
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
          borrower_work_background {
            id
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
            area {
              id
              name
              branch_sub_id
              branch_sub {
                id
                branch_id
                code
                name
                branch {
                  name
                }
              }
            }
          }
          borrower_company_info {
            id
            employer
            salary
            contract_duration
          }
          borrower_reference {
            id
            occupation
            name
            contact_no
          }
          user {
            id
            name
          }
          branch_sub {
            code
            name
            branch {
              name
            }
          }
        }
        paginatorInfo {
          total
          currentPage
          lastPage
          perPage
          hasMorePages
        }
      }
    }
`;

const GET_SINGLE_BORROWER_QUERY: string = `
    query GetBorrower($id: ID!){
      getBorrower(id: $id) {
        id
        payer_standing
        decision {
          status
          reason
          decided_at
        }
        user_id
        chief_id
        amount_applied
        purpose
        firstname
        middlename
        lastname
        terms_of_payment
        residence_address
        is_rent
        other_source_of_inc
        est_monthly_fam_inc
        employment_position
        gender
        photo
        is_deleted
        chief {
          id
          name
        }
        borrower_details {
          id
          dob
          place_of_birth
          age
          email
          contact_no
          civil_status
        }
        borrower_spouse_details {
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
        borrower_work_background {
          id
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
          area {
            id
            name
            branch_sub_id
            branch_sub {
              id
              branch_id
              name
            }
          }
        }
        borrower_company_info {
          id
          employer
          salary
          contract_duration
        }
        borrower_reference {
          id
          occupation
          name
          contact_no
        }
        user {
          id
          name
          branchSub {
            id
            name
            branch_id
          }
        }
        branch_sub {
          name
          branch {
            name
          }
        }
      }
    }
`;

const GET_BORROWER_ATTACHMENTS_QUERY: string = `
    query GetBorrAttachments($first: Int!, $page: Int!, $orderBy: [OrderByClause!], $borrower_id: Int){
        getBorrAttachments(first: $first, page: $page, orderBy: $orderBy, borrower_id: $borrower_id){
        data {
          id
          borrower_id
          user_id
          name
          file_type
          file_path
          is_deleted
        }
        paginatorInfo {
          total
          currentPage
          lastPage
          perPage
          hasMorePages
        } 	
      }
    }
`;

const SAVE_BORROWER_ATTACHMENTS_QUERY: string = `
    mutation SaveBorrAttachment($input: BorrowerAttachmentInput!, $file: Upload){
      saveBorrAttachment(input: $input, file: $file){
        success
        message
        attachment {
            id
            file_type
            file_path
            name
        }
      }
    }
`;

const UPDATE_BORROWER_ATTACHMENTS_QUERY: string = `
    mutation UpdateBorrAttachment($input: BorrowerAttachmentInput){
      updateBorrAttachment(input: $input) {
        id
        name
      }
    }
`;

const SAVE_BORROWER_MUTATION: string = `
    mutation SaveBorrower(
      $inputBorrInfo: BorrowerInput!,
      $inputBorrDetail: BorrowerDetailsInput!,
      $inputBorrSpouseDetail: BorrowerSpouseDetailsInput!,
      $inputBorrWorkBg: BorrowerWorkBgInput!,
      $inputBorrReference: BorrowerReferenceInput!,
      $inputBorrCompInfo: BorrowerCompInfoInput!,
    ){
      saveBorrower(
        inputBorrInfo: $inputBorrInfo,
        inputBorrDetail: $inputBorrDetail,
        inputBorrSpouseDetail: $inputBorrSpouseDetail,
        inputBorrWorkBg: $inputBorrWorkBg,
        inputBorrReference: $inputBorrReference,
        inputBorrCompInfo: $inputBorrCompInfo
      ) {
        success
        message
      }
    }
`;

/**
 * Create as borrower: the same save as SAVE_BORROWER_MUTATION, from an application. It
 * adds the one top-level argument `application_id`, which makes the server check the
 * application and mark it converted in the same transaction. A SEPARATE operation on
 * purpose, so the plain save above, and the variables New Borrower posts, stay as they
 * were. Built from the variables by withApplication (src/utils/convertApplication.ts).
 *
 * The variable is declared NON-NULL (Int!) although the server's argument is optional: this
 * operation exists only to convert, so an id that goes missing on the way (a dropped
 * undefined, a NaN that JSON turns into null) must fail GraphQL's own validation, with
 * nothing saved, rather than turn into a plain save that creates an unlinked borrower.
 */
const SAVE_BORROWER_FROM_APPLICATION_MUTATION: string = `
    mutation SaveBorrowerFromApplication(
      $inputBorrInfo: BorrowerInput!,
      $inputBorrDetail: BorrowerDetailsInput!,
      $inputBorrSpouseDetail: BorrowerSpouseDetailsInput!,
      $inputBorrWorkBg: BorrowerWorkBgInput!,
      $inputBorrReference: BorrowerReferenceInput!,
      $inputBorrCompInfo: BorrowerCompInfoInput!,
      $application_id: Int!
    ){
      saveBorrower(
        inputBorrInfo: $inputBorrInfo,
        inputBorrDetail: $inputBorrDetail,
        inputBorrSpouseDetail: $inputBorrSpouseDetail,
        inputBorrWorkBg: $inputBorrWorkBg,
        inputBorrReference: $inputBorrReference,
        inputBorrCompInfo: $inputBorrCompInfo,
        application_id: $application_id
      ) {
        success
        message
      }
    }
`;

const GET_BORROWER_CO_MAKER: string = `
  query GetBorrCoMaker($first: Int, $page: Int, $orderBy: [OrderByClause!], $borrower_id: Int){
    getBorrCoMaker(first: $first,
                    page: $page,
                    orderBy: $orderBy,
                    borrower_id: $borrower_id){
        data {
          id
          name
          relationship
          marital_status
          address
          birthdate
          contact_no
          borrower_id
          user_id
        }
        paginatorInfo {
          total
          currentPage
          lastPage
          perPage
          hasMorePages
        } 	
    }
  }
`;

const SAVE_BORROWER_CO_MAKER: string = `
  mutation SaveBorrCoMaker($input: BorrowerComakerInput){
    saveBorrCoMaker(input: $input){
        id
        name
        relationship
        marital_status
        address
        birthdate
        contact_no
    }
  }
`;

const DELETE_BORROWER_CO_MAKER: string = `
  mutation deleteBorrCoMaker($input: BorrowerComakerInputDelete){
    deleteBorrCoMaker(input: $input){
      id
      name
    }
  }
`;

const DELETE_BORROWER_MUTATION: string = `
  mutation deleteBorrower($id: ID!, $reason: String){
    deleteBorrower(id: $id, reason: $reason){
      status
      message
      immediate
      request_id
    }
  }
`;

/**
 * Approve or reject a borrower (the borrower page header). Each call adds a decision and the
 * latest is the borrower's status. A rejected borrower cannot borrow until approved again (the
 * server refuses new loans, renewals, approvals and releases; spec E §1). The server
 * requires a reason for rejected, and answers "Borrower not found." for a borrower the user
 * may not open.
 */
const SET_BORROWER_DECISION_MUTATION: string = `
  mutation SetBorrowerDecision($borrower_id: Int!, $status: String!, $reason: String) {
    setBorrowerDecision(borrower_id: $borrower_id, status: $status, reason: $reason) {
      status
      reason
      decided_at
    }
  }
`;

const CHECK_BORROWER_DUPLICATE: string = `
  query CheckBorrowerDuplicate(
    $firstname: String!
    $middlename: String
    $lastname: String!
    $dob: String!
    $email: String
    $contact_no: String
    $excludeId: ID
    $branch_sub_id: ID
  ) {
    checkBorrowerDuplicate(
      firstname: $firstname
      middlename: $middlename
      lastname: $lastname
      dob: $dob
      email: $email
      contact_no: $contact_no
      excludeId: $excludeId
      branch_sub_id: $branch_sub_id
    ) {
      isDuplicate
      duplicateType
      duplicateBorrower {
        id
        firstname
        middlename
        lastname
        borrower_details {
          email
          contact_no
        }
      }
      duplicateProblem {
        isProblem
        shortfall
        cutoffsMissed
        uaCutoffs
        problemLoanCount
        oldestUnpaidDueDate
      }
      message
    }
  }
`;

// Minimal-disclosure cross-branch existence check for the create-borrower
// "Check" button. Returns only aggregates (branch names + a problem flag),
// never a borrower row — so an encoder can be warned without seeing another
// branch's client list.
const CHECK_BORROWER_CROSS_BRANCH: string = `
  query CheckBorrowerCrossBranch(
    $firstname: String
    $middlename: String
    $lastname: String
    $contact_no: String
  ) {
    checkBorrowerCrossBranch(
      firstname: $firstname
      middlename: $middlename
      lastname: $lastname
      contact_no: $contact_no
    ) {
      existsElsewhere
      branches
      isProblem
      worstCutoffsMissed
      matchCount
      existsInMyBranches
      myBranches
      myBranchIsProblem
      myBranchWorstCutoffs
      myBranchMatchCount
      locations { group branch sub_branch }
      myLocations { group branch sub_branch }
    }
  }
`;

const BorrowerQueryMutations = {
  GET_BORROWER_QUERY,
  GET_SINGLE_BORROWER_QUERY,
  GET_BORROWER_ATTACHMENTS_QUERY,
  SAVE_BORROWER_MUTATION,
  SAVE_BORROWER_FROM_APPLICATION_MUTATION,
  SAVE_BORROWER_ATTACHMENTS_QUERY,
  UPDATE_BORROWER_ATTACHMENTS_QUERY,
  GET_BORROWER_CO_MAKER,
  SAVE_BORROWER_CO_MAKER,
  DELETE_BORROWER_CO_MAKER,
  DELETE_BORROWER_MUTATION,
  SET_BORROWER_DECISION_MUTATION,
  CHECK_BORROWER_DUPLICATE,
  CHECK_BORROWER_CROSS_BRANCH
};

export default BorrowerQueryMutations;