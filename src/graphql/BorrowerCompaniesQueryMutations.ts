const GET_BORROWER_COMPANIES: string = `
    query GetBorrCompanies($first: Int!, $page: Int!, $orderBy: [OrderByClause!]){
      getBorrCompanies(first: $first, page: $page, orderBy: $orderBy) {
        data {
          id
          name
          address
          contact_no
          contact_email,
          contact_person
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
const SAVE_BORROWER_COMPANIES: string = `
  mutation CompanyBorrowerInput($input: CompanyBorrowerInput!){
    createBorrCompanies(input: $input) {
      id
      name
    }
  }
`;
const UPDATE_BORROWER_COMPANIES: string = `
  mutation UpdateBorrCompanies($input: CompanyBorrowerInput!){
    updateBorrCompanies(input: $input) {
      id
      name
    }
  }
`;
const DELETE_BORR_COMP_MUTATION: string = `
  mutation DeleteBorrCompanies($input: CompanyBorrowerDeleteInput!){
    deleteBorrCompanies(input: $input) {
      id
      name
    }
  }
`;

const BorrowerCompaniesQueryMutations = {
  GET_BORROWER_COMPANIES,
  SAVE_BORROWER_COMPANIES,
  UPDATE_BORROWER_COMPANIES,
  DELETE_BORR_COMP_MUTATION
};

export default BorrowerCompaniesQueryMutations;