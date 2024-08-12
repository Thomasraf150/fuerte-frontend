const BORROWER_LOAN_QUERY: string = `
  query GetLoans($first: Int, $page: Int, $orderBy: [OrderByClause!], $borrower_id: Int){
    getLoans(first: $first,
        page: $page,
        orderBy: $orderBy,
        borrower_id: $borrower_id){
        data {
          id
          loan_proceeds
          pn_amount
          monthly
          term
          status
          loan_proceeds
          pn_balance
          udi_balance
          created_at
          approved_date
          released_date
          loan_product {
            id 
            description
            terms
            interest_rate
            udi
            processing
            insurance
            commission
            collection
            notarial
            addon
          }
          loan_details {
            id
            description
            debit
            credit
          }
          borrower {
            id
            firstname
            middlename
            lastname
          }
        }
    }
  }
`;
const PROCESS_BORROWER_LOAN_MUTATION: string = `
  mutation ProcessALoan($input: LoanComputationInput, $process_type: String!){
    processALoan(input: $input, process_type: $process_type){
      deductions {
        udi
        processing
        collection
        insurance
        notarial
      }
      deduction_rate {
        udi
        processing
        collection
        insurance
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
  BORROWER_LOAN_QUERY,
  PROCESS_BORROWER_LOAN_MUTATION
};

export default LoanProductsQueryMutations;