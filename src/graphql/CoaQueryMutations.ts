const COA_TABLE_QUERY: string = `
    query GetChartOfAccounts($input: InputCoa){
      getChartOfAccounts(input: $input) {
          id
          user_id
          branch_sub_id
          account_name
          number
          description
          balance
          is_debit
          parent_account_id
          subAccounts {
            id
            user_id
            branch_sub_id
            account_name
            number
            description
            balance
            is_debit
            parent_account_id
            subAccounts {
              id
              user_id
              branch_sub_id
              account_name
              number
              description
              balance
              is_debit
              parent_account_id
              subAccounts {
                id
                user_id
                branch_sub_id
                account_name
                number
                description
                balance
                is_debit
                parent_account_id
                subAccounts {
                  id
                  user_id
                  branch_sub_id
                  account_name
                  number
                  description
                  balance
                  is_debit
                  parent_account_id
                  
                }
              }
            }
          }
      }
    }
`;


const SAVE_COA_MUTATION: string = `
    mutation CreateCoa($input: PayloadCoa){
      createCoa (input: $input){
        message
        status
      }
    }
`;

const UPDATE_COA_MUTATION: string = `
    mutation CreateCoa($input: PayloadCoa){
      createCoa (input: $input){
        message
        status
      }
    }
`;



const CoaQueryMutations = {
  COA_TABLE_QUERY,
  UPDATE_COA_MUTATION,
  SAVE_COA_MUTATION
};

export default CoaQueryMutations;