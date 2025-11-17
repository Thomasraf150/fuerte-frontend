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
          is_active
          parent_account_id
          branch_sub {
            id
            name
          }
          subAccounts {
            id
            user_id
            branch_sub_id
            account_name
            number
            description
            balance
            is_debit
            is_active
            parent_account_id
            branch_sub {
              id
              name
            }
            subAccounts {
              id
              user_id
              branch_sub_id
              account_name
              number
              description
              balance
              is_debit
              is_active
              parent_account_id
              branch_sub {
                id
                name
              }
              subAccounts {
                id
                user_id
                branch_sub_id
                account_name
                number
                description
                balance
                is_debit
                is_active
                parent_account_id
                branch_sub {
                  id
                  name
                }
                subAccounts {
                  id
                  user_id
                  branch_sub_id
                  account_name
                  number
                  description
                  balance
                  is_debit
                  is_active
                  parent_account_id
                  branch_sub {
                    id
                    name
                  }

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
    mutation UpdateCoa($input: PayloadCoa){
      updateCoa (input: $input){
        message
        status
      }
    }
`;

const TOGGLE_ACTIVE_STATUS_MUTATION: string = `
    mutation ToggleActiveStatus($id: ID!, $active: Boolean!, $cascade: Boolean){
      toggleActiveStatus (id: $id, active: $active, cascade: $cascade){
        message
        status
        affectedAccounts {
          id
          account_name
          is_active
        }
      }
    }
`;

const PRINT_CHART_OF_ACCOUNTS: string = `
    mutation PrintChartOfAccounts($branch_sub_id: String){
      printChartOfAccounts(branch_sub_id: $branch_sub_id) {
        url
        filename
        size
      }
    }
`;

const CoaQueryMutations = {
  COA_TABLE_QUERY,
  UPDATE_COA_MUTATION,
  SAVE_COA_MUTATION,
  TOGGLE_ACTIVE_STATUS_MUTATION,
  PRINT_CHART_OF_ACCOUNTS
};

export default CoaQueryMutations;