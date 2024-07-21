const GET_CHIEF_QUERY: string = `
    query GetChief($first: Int!, $page: Int!, $orderBy: [OrderByClause!]){
      getChief(first: $first, page: $page, orderBy: $orderBy) {
        data {
          id
          user_id
          name
          address
          contact_no
          email
          is_active
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

const SAVE_CHIEF_MUTATION: string = `
    mutation SaveChief($input: ChiefInput!){
      saveChief(input: $input) {
        id
        name
      }
    }
`;

const UPDATE_CHIEF_MUTATION: string = `
    mutation UpdateChief($input: ChiefInput!){
      updateChief(input: $input) {
        id
        name
      }
    }
`;

const DELETE_CHIEF_MUTATION: string = `
    mutation DeleteChief($input: ChiefDeleteInput!){
      deleteChief(input: $input) {
        id
        name
      }
    }
`;

const ChiefQueryMutations = {
  GET_CHIEF_QUERY,
  SAVE_CHIEF_MUTATION,
  UPDATE_CHIEF_MUTATION,
  DELETE_CHIEF_MUTATION
};

export default ChiefQueryMutations;