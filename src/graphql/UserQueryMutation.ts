const GET_USER_QUERY: string = `
    query GetUsers($first: Int!, $page: Int!, $orderBy: [OrderByClause!]) {
      users(first: $first, page: $page, orderBy: $orderBy) {
        data {
          id
          name
          email
          branch_sub_id
          role_id
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

const CREATE_USER_MUTATION: string = `
    mutation CreateUser($input: UserInput!){
      createUser(input: $input){
        id
        name
      }
    }
`;

const UPDATE_USER_MUTATION: string = `
    mutation UpdateUser($input: UpdateUserInput!){
      updateUser(input: $input){
        id
        name
      }
    }
`;

const GET_SINGLE_USER_QUERY: string = `
    query GetSingleUser($id: ID!){
      user(id: $id){
        id
        name
        email
        branch_sub_id
        role_id
        branchSub {
          id
          name
        }
      }
    }
`;
const GET_ROLE_QUERY: string = `
    query {
      role {
        id
        name
        code
      }
    }
`;

const UserQueryMutations = {
  GET_USER_QUERY,
  CREATE_USER_MUTATION,
  GET_SINGLE_USER_QUERY,
  UPDATE_USER_MUTATION,
  GET_ROLE_QUERY
};

export default UserQueryMutations;