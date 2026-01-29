const SAVE_BRANCH_MUTATION: string = `
  mutation SaveBranchInput($input: BranchesInput!) {
    createBranch (input: $input) {
      name
    }
  }
`;
const UPDATE_BRANCH_MUTATION: string = `
  mutation UpdateBranchInput($input: BranchesUpdateInput!) {
    updateBranch (input: $input) {
      name
    }
  }
`;

const GET_BRANCH_QUERY: string = `
  query GetBranches($orderBy: String) {
    getBranch(orderBy: $orderBy) {
      id
      name
      user_id
      is_deleted
      user {
        name
        email
      }
    }
  }
`;

const DELETE_BRANCH_MUTATION: string = `
  mutation DeleteBranch($id: ID!) {
    deleteBranch(id: $id) {
      id
      name
    }
  }
`;

const GET_SUB_BRANCH_QUERY: string = `
  query GetBranchesSub($orderBy: String, $branch_id: Int!) {
    getBranchSub(orderBy: $orderBy, branch_id: $branch_id) {
      id
      branch_id
      code
      name
      address
      contact_no
      head_name
      head_contact
      head_email
      ref_ctr_year
      ref_ctr_day
      ref_no_length,
      ref_current_value
      user_id
      is_deleted
      user {
        name
        email
      }
      branch {
        name
      }
    }
  }
`;

const SAVE_SUB_BRANCH_MUTATION: string = `
  mutation CreateBranchSub($input: BranchSubInput!) {
    createBranchSub(input: $input) {
      id
      branch_id
      code
      name
      address
      contact_no
      head_name
      head_contact
      head_email
      ref_ctr_year
      ref_ctr_day,
      ref_no_length,
      ref_current_value
      user_id
      is_deleted
    }
  }
`;

const UPDATE_SUB_BRANCH_MUTATION: string = `
  mutation UpdateBranchSub($input: BranchesSubUpdateInput!) {
    updateBranchSub(input: $input) {
      id
      branch_id
      code
      name
      address
      contact_no
      head_name
      head_contact
      head_email
      ref_ctr_year
      ref_ctr_day,
      ref_no_length,
      ref_current_value
      user_id
      is_deleted
    }
  }
`;

const DELETE_SUB_BRANCH_MUTATION: string = `
  mutation DeleteSubBranch($id: ID!) {
    deleteSubBranch(id: $id) {
      id
      name
    }
  }
`;
const GET_ALL_SUB_BRANCH_QUERY: string = `
  query GetAllBranch($orderBy: String) {
    getAllBranch(orderBy: $orderBy){
      id
      name
    }
  }
`;

const GET_MY_ACCESSIBLE_BRANCH_SUBS_QUERY: string = `
  query GetMyAccessibleBranchSubs {
    getMyAccessibleBranchSubs {
      id
      branch_id
      code
      name
      address
    }
  }
`;

const BranchQueryMutations = {
  GET_BRANCH_QUERY,
  DELETE_BRANCH_MUTATION,
  SAVE_BRANCH_MUTATION,
  UPDATE_BRANCH_MUTATION,
  GET_SUB_BRANCH_QUERY,
  SAVE_SUB_BRANCH_MUTATION,
  UPDATE_SUB_BRANCH_MUTATION,
  DELETE_SUB_BRANCH_MUTATION,
  GET_ALL_SUB_BRANCH_QUERY,
  GET_MY_ACCESSIBLE_BRANCH_SUBS_QUERY
};

export default BranchQueryMutations;
