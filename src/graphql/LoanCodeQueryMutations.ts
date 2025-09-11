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

const GET_LOAN_CODES_BATCH_QUERY: string = `
  query GetLoanCodesBatch($orderBy: String!, $page: Int, $perPage: Int, $pagesPerBatch: Int){
    getLoanCodesBatch(orderBy: $orderBy, page: $page, perPage: $perPage, pagesPerBatch: $pagesPerBatch){
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
      pagination {
        currentBatch
        totalBatches
        batchStartPage
        batchEndPage
        totalRecords
        hasNextBatch
      }
    }
  }
`;

const LoanCodeQueryMutations = {
  GET_LOAN_CODE_QUERY,
  GET_LOAN_TYPE_QUERY,
  SAVE_LOAN_CODE_MUTATION,
  UPDATE_LOAN_CODE_MUTATION,
  GET_LOAN_CODES_BATCH_QUERY
};

export default LoanCodeQueryMutations;