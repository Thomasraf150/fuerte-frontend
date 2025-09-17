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

const LoanClientsQueryMutations = {
  GET_LOAN_CLIENT_QUERY
};

export default LoanClientsQueryMutations;