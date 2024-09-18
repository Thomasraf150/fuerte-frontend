const LOANS_LIST_QUERY: string = `
  query GetLoanListPymntPosting($first: Int, $page: Int, $orderBy: [OrderByClause!], $borrower_id: Int){
    getLoanListPymntPosting(first: $first,
        page: $page,
        orderBy: $orderBy,
        borrower_id: $borrower_id){
        data {
          id
          loan_ref
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
          bank_id
          check_no
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
          loan_bank_details {
            account_name
            issued_acct_no
            issued_bank_id
            issued_pin
            loan_id
            surrendered_acct_no
            surrendered_bank_id
            surrendered_pin
          }
          loan_schedules {
            amount
            due_date
          }
          loan_udi_schedules {
            amount
            due_date
          }
        }
    }
  }
`;

const GET_LOAN_SCHEDULE: string = `
  query GetLoanSchedule($input: LoanScheduleInput){
  getLoanSchedule(input: $input){
    id
    loan_schedules {
      amount
      due_date
    }
    loan_udi_schedules {
      amount
      due_date
    }
  }
}
`;

const PaymentPostingQueryMutation = {
  LOANS_LIST_QUERY,
  GET_LOAN_SCHEDULE
};

export default PaymentPostingQueryMutation;