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
    query GetBorrAttachments($first: Int!, $page: Int!, $orderBy: [OrderByClause!]){
        getBorrAttachments(first: $first, page: $page, orderBy: $orderBy){
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



const BorrowerQueryMutations = {
  GET_BORROWER_QUERY,
  GET_BORROWER_ATTACHMENTS_QUERY,
  SAVE_BORROWER_MUTATION
};

export default BorrowerQueryMutations;