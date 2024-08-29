const GET_BANKS_QUERY: string = `
    query GetBanks($first: Int,
                  $page: Int,
                  $orderBy: [OrderByClause!]){
      getBanks(first: $first, page: $page, orderBy: $orderBy){
        data {
          id
          user_id
          branch_sub_id
          name
          address
          phone
          contact_person
          mobile
          email
        }
      }
    }
`;

const UPDATE_BANK_MUTATION: string = `
  mutation UpdateBank($input: BankInput!){
    updateBank(input: $input){
      id
      name
    }
  }
`;
const SAVE_BANK_MUTATION: string = `
  mutation SaveBank($input: BankInput!){
    saveBank(input: $input){
      id
      name
    }
  }
`;
const DELETE_BANK_MUTATION: string = `
  mutation DeleteBank($input: BankDeleteInput!){
    deleteBank(input: $input){
      id
      name
    }
  }
`;

const BankQueryMutations = {
  GET_BANKS_QUERY,
  UPDATE_BANK_MUTATION,
  SAVE_BANK_MUTATION,
  DELETE_BANK_MUTATION
};

export default BankQueryMutations;