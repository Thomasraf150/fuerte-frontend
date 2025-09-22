const LOANS_LIST_QUERY: string = `
  query GetLoanListPymntPosting($first: Int, $page: Int, $orderBy: [OrderByClause!], $borrower_id: Int, $search: String){
    getLoanListPymntPosting(first: $first,
        page: $page,
        orderBy: $orderBy,
        borrower_id: $borrower_id,
        search: $search){
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
          is_closed
          loan_product {
            id
            description
            terms
            interest_rate
            udi
            processing
            agent_fee
            insurance
            commission
            collection
            notarial
            base_deduction
            addon_terms
            addon_udi_rate
            is_active
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
            id
            amount
            due_date
            loan_payments {
              description
              amount
            }
          }
          loan_udi_schedules {
            id
            amount
            due_date
          }
          custom_status
        }
        paginatorInfo {
          total
          currentPage
          lastPage
          hasMorePages
        }
    }
  }
`;

const GET_LOAN_SCHEDULE: string = `
  query GetLoanSchedule($input: LoanScheduleInput){
  getLoanSchedule(input: $input){
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
      agent_fee
      insurance
      commission
      collection
      notarial
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
      id
      amount
      loan_id
      due_date
      loan_payments {
        description
        amount
      }
    }
    loan_udi_schedules {
      id
      amount
      loan_id
      due_date
    }
  }
}
`;

const PROCESS_COLLECTION_PAYMENT: string = `
  mutation PaymentPosting($input: PaymentPostingInput){
    paymentPosting(input: $input){
      message
      status
    }
  }
`;

const PROCESS_COLLECTION_OTHER_PAYMENT: string = `
  mutation OtherPaymentPosting($input: OtherPaymentPostingInput){
    otherPaymentPosting(input: $input){
      message
      status
    }
  }
`;
const PROCESS_REMOVE_POSTED_PAYMENT: string = `
  mutation DeletePostedPayment($input: DeletePostedPaymentInput){
    deletePostedPayment(input: $input) {
      message
      status
    }
  }
`;

const PaymentPostingQueryMutation = {
  LOANS_LIST_QUERY,
  GET_LOAN_SCHEDULE,
  PROCESS_COLLECTION_PAYMENT,
  PROCESS_COLLECTION_OTHER_PAYMENT,
  PROCESS_REMOVE_POSTED_PAYMENT
};

export default PaymentPostingQueryMutation;