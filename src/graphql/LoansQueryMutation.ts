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
          is_pn_signed
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
const BORROWER_SINGLE_LOAN_QUERY: string = `
  query GetLoan($loan_id: Int){
    getLoan(loan_id: $loan_id){
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
      is_pn_signed
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
      loan_schedules {
        id
        amount
        due_date
      }
      loan_udi_schedules {
        id
        amount
        due_date
      }
      borrower {
        id
        firstname
        middlename
        lastname
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
const APPROVE_LOAN_BY_SCHEDULE: string = `
  mutation SaveLoanSchedule($input: LoanScheduleAppvl, 
      $interest: [String!], 
      $monthly: [String!], 
      $selectedDate: [String!], 
      $status: Int!){
    saveLoanSchedule(input: $input, interest: $interest,
      monthly: $monthly,
      selectedDate: $selectedDate,
      status: $status
    ){
      success
      message
    }
  }
`;

const LoanProductsQueryMutations = {
  BORROWER_LOAN_QUERY,
  PROCESS_BORROWER_LOAN_MUTATION,
  APPROVE_LOAN_BY_SCHEDULE,
  BORROWER_SINGLE_LOAN_QUERY
};

export default LoanProductsQueryMutations;