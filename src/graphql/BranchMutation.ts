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
      ref_ctr_month
      ref_ctr_day
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

const BranchMutations = {
  GET_BRANCH_QUERY,
  SAVE_BRANCH_MUTATION,
  UPDATE_BRANCH_MUTATION,
  GET_SUB_BRANCH_QUERY
};

export default BranchMutations;
