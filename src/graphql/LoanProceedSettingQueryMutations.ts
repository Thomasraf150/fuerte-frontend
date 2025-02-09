const SAVE_LOAN_PROCEED_SETTINGS: string = `
  mutation CreateLoanProceedSettings($input: InputLoanProceedSettings!){
    createLoanProceedSettings(input: $input){
      status
      message
    }
  }
`;

const GET_LOAN_PROCEED_SETTINGS: string = `
  query GetLoanProceedSettings($input: LoanProceedAcctInp){
    getLoanProceedSettings(input: $input){
      id
      user_id
      branch_sub_id
      account_id
      description
      is_deleted
      branch_sub {
        name
      }
      account {
        account_name
        number
      }
    }
  }
`;

const LoanProceedSettingQueryMutations = {
  SAVE_LOAN_PROCEED_SETTINGS,
  GET_LOAN_PROCEED_SETTINGS
};

export default LoanProceedSettingQueryMutations;