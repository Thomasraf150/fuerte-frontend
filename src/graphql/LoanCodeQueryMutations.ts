const GET_LOAN_CODE_QUERY: string = `
  query GetLoanCodes($orderBy: String!){
    getLoanCodes(orderBy: $orderBy){
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

const LoanCodeQueryMutations = {
  GET_LOAN_CODE_QUERY,
  GET_LOAN_TYPE_QUERY,
  SAVE_LOAN_CODE_MUTATION,
  UPDATE_LOAN_CODE_MUTATION
};

export default LoanCodeQueryMutations;