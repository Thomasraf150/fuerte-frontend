const GET_LOAN_CODE_QUERY: string = `
  query GetLoanCodes($first: Int!, $page: Int!, $orderBy: [OrderByClause!], $search: String){
    getLoanCodes(first: $first, page: $page, orderBy: $orderBy, search: $search){
      data {
        id
        code
        description
        user_id
        is_deleted
        loan_client_id
        loan_type_id
        loan_client {
          name
        }
        loan_type {
          name
        }
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
const GET_LOAN_TYPE_QUERY: string = `
  query GetLoanTypes($orderBy: String!){
    getLoanTypes(orderBy: $orderBy){
      id
      name
    }
  }
`;
const SAVE_LOAN_CODE_MUTATION: string = `
  mutation CreateLoanCode($input: LoanCodesInput!){
    createLoanCode(input: $input){
      id
      code
    }
  }
`;
const UPDATE_LOAN_CODE_MUTATION: string = `
  mutation UpdateLoanCode($input: LoanCodesInput!){
    updateLoanCode(input: $input){
      id
      code
    }
  }
`;

const GET_LOAN_CODE_BY_ID: string = `
  query GetLoanCodeById($id: ID!) {
    getLoanCodeById(id: $id) {
      id
      code
      description
      user_id
      is_deleted
      loan_client_id
      loan_type_id
      loan_client {
        name
      }
      loan_type {
        name
      }
    }
  }
`;

const LoanCodeQueryMutations = {
  GET_LOAN_CODE_QUERY,
  GET_LOAN_TYPE_QUERY,
  SAVE_LOAN_CODE_MUTATION,
  UPDATE_LOAN_CODE_MUTATION,
  GET_LOAN_CODE_BY_ID
};

export default LoanCodeQueryMutations;