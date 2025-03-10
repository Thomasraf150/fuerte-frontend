
const GET_UTB: string = `
  query GetUnadjustedTBal($input: InputTBalAcct){
    getUnadjustedTBal(input: $input) {
      assets {
        id
        account_name
        number
        balance
        total_debit
        total_credit
        adj_debit
        adj_credit
      }
      liabilities {
        id
        account_name
        number
        balance
        total_debit
        total_credit
        adj_debit
        adj_credit
      }
      capital {
        id
        account_name
        number
        balance
        total_debit
        total_credit
        adj_debit
        adj_credit
      }
      revenue {
        id
        account_name
        number
        balance
        total_debit
        total_credit
        adj_debit
        adj_credit
      }
      expenses {
        id
        account_name
        number
        balance
        total_debit
        total_credit
        adj_debit
        adj_credit
      }
    }
  }
`;

const TrialBalanceQueryMutations = {
  GET_UTB
};

export default TrialBalanceQueryMutations;