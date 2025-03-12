const GET_BORROWER_QUERY: string = `
    query GetBorrowers($first: Int!, $page: Int!, $orderBy: [OrderByClause!]){
      getBorrowers(first: $first, page: $page, orderBy: $orderBy) {
        data {
          id
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

const BorrowerQueryMutations = {
  GET_BORROWER_QUERY,
  GET_BORROWER_ATTACHMENTS_QUERY,
  SAVE_BORROWER_MUTATION,
  SAVE_BORROWER_ATTACHMENTS_QUERY,
  UPDATE_BORROWER_ATTACHMENTS_QUERY,
  GET_BORROWER_CO_MAKER,
  SAVE_BORROWER_CO_MAKER,
  DELETE_BORROWER_CO_MAKER
};

export default BorrowerQueryMutations;