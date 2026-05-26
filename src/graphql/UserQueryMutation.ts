const GET_USER_QUERY: string = `
    query GetUsers($first: Int!, $page: Int!, $search: String, $orderBy: [OrderByClause!]) {
      users(first: $first, page: $page, search: $search, orderBy: $orderBy) {
        data {
          id
          name
          email
          branch_sub_id
          role_id
          role {
            id
            name
            code
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
        additionalBranchSubs {
          id
          name
        }
      }
    }
`;

const SET_USER_BRANCH_ACCESS_MUTATION: string = `
    mutation SetUserBranchAccess($user_id: ID!, $branch_sub_ids: [ID!]!) {
      setUserBranchAccess(user_id: $user_id, branch_sub_ids: $branch_sub_ids) {
        id
        additionalBranchSubs {
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
  GET_ROLE_QUERY,
  SET_USER_BRANCH_ACCESS_MUTATION
};

export default UserQueryMutations;