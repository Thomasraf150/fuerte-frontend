const PROCESS_BORROWER_LOAN_MUTATION: string = `
  mutation ProcessALoan($input: LoanComputationInput, $process_type: String!){
    processALoan(input: $input, process_type: $process_type){
      deductions {
        udi
        processing
        collection
        notarial
      }
      deduction_rate {
        udi
        processing
        collection
      }
      total_deductions
      loan_proceeds
      terms
      pn
      monthly_amort
      ob
      rebates
      penalty
      new_loan_proceeds
    }
  }
`;

const LoanProductsQueryMutations = {
  PROCESS_BORROWER_LOAN_MUTATION
};

export default LoanProductsQueryMutations;