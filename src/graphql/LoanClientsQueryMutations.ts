const GET_LOAN_CLIENT_QUERY: string = `
    query GetLoanClient($first: Int!, $page: Int!, $orderBy: [OrderByClause!], $search: String){
      getLoanClient(first: $first, page: $page, orderBy: $orderBy, search: $search){
        data {
          id
          name
          penalty_rate
          user_id
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

const LoanClientsQueryMutations = {
  GET_LOAN_CLIENT_QUERY
};

export default LoanClientsQueryMutations;