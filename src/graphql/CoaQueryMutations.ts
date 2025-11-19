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

const GET_ACCOUNT_BY_ID_QUERY: string = `
    query GetAccountById($id: ID!){
      getAccountById(id: $id) {
        id
        user_id
        branch_sub_id
        account_name
        description
        number
        balance
        is_debit
        is_active
        parent_account_id
        created_at
        updated_at
        parent {
          id
          account_name
          number
        }
        subAccounts {
          id
          account_name
          number
          is_active
        }
        branch_sub {
          id
          name
        }
        created_by {
          id
          name
        }
        transaction_count
        has_transactions
      }
    }
`;

const GET_ACCOUNT_TRANSACTIONS_QUERY: string = `
    query GetAccountTransactions(
      $accountNumber: String!
      $startDate: String
      $endDate: String
      $journalType: String
      $limit: Int
      $offset: Int
    ){
      getAccountTransactions(
        accountNumber: $accountNumber
        startDate: $startDate
        endDate: $endDate
        journalType: $journalType
        limit: $limit
        offset: $offset
      ) {
        total_count
        beginning_balance
        ending_balance
        transactions {
          id
          journal_ref
          journal_name
          journal_type
          journal_date
          posted_date
          journal_desc
          document_no
          check_no
          debit
          credit
          running_balance
          is_posted
          is_cancelled
          posted_by_name
          vendor_name
          borrower_name
        }
      }
    }
`;

const CoaQueryMutations = {
  COA_TABLE_QUERY,
  UPDATE_COA_MUTATION,
  SAVE_COA_MUTATION,
  TOGGLE_ACTIVE_STATUS_MUTATION,
  PRINT_CHART_OF_ACCOUNTS,
  GET_ACCOUNT_BY_ID_QUERY,
  GET_ACCOUNT_TRANSACTIONS_QUERY
};

export default CoaQueryMutations;