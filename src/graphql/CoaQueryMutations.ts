const COA_TABLE_QUERY: string = `
    query GetChartOfAccounts($input: InputCoa){
      getChartOfAccounts(input: $input) {
          id
          account_name
          description
          balance
          is_debit
          subAccounts {
            id
            account_name
            description
            balance
            is_debit
            subAccounts {
              id
              account_name
              description
              balance
              is_debit
              subAccounts {
                id
                account_name
                description
                balance
                is_debit
              }
            }
          }
      }
    }
`;

const CoaQueryMutations = {
  COA_TABLE_QUERY
};

export default CoaQueryMutations;