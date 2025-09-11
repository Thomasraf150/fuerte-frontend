const GET_LOAN_CLIENT_QUERY: string = `
    query GetLoanClient($orderBy: String!){
      getLoanClient(orderBy: $orderBy){
        id
        name
        penalty_rate
        user_id
      }
    }
`;

const GET_LOAN_CLIENTS_BATCH_QUERY: string = `
    query GetLoanClientsBatch($orderBy: String!, $page: Int, $perPage: Int, $pagesPerBatch: Int){
      getLoanClientsBatch(orderBy: $orderBy, page: $page, perPage: $perPage, pagesPerBatch: $pagesPerBatch){
        data {
          id
          name
          penalty_rate
          user_id
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

const LoanClientsQueryMutations = {
  GET_LOAN_CLIENT_QUERY,
  GET_LOAN_CLIENTS_BATCH_QUERY
};

export default LoanClientsQueryMutations;