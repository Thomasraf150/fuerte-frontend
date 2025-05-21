const BORROWER_LOAN_QUERY: string = `
  query GetLoans($first: Int, $page: Int, $orderBy: [OrderByClause!], $borrower_id: Int){
    getLoans(first: $first,
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
          is_closed
          addon_terms
          addon_amount
          addon_udi
          addon_total
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
            borrower_details {
              dob
              place_of_birth
              age
              email
              contact_no
              civil_status
            }
            borrower_spouse_details {
              work_address
              occupation
              fullname
              company
              dept_branch
              length_of_service
              salary
              company_contact_person
              contact_no
            }
            borrower_work_background {
              company_borrower_id
              employment_number
              area_id
              sub_area_id
              station
              term_in_service
              employment_status
              division
              monthly_gross
              monthly_net
              office_address
            }
            borrower_company_info {
              employer
              salary
              contract_duration
            }
            borrower_reference {
              occupation
              name
              contact_no
            }
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
          acctg_entry {
            journal_no
            journal_ref
          }
          user {
            branch_sub_id
            name
          }
          custom_status
        }
    }
  }
`;
const BORROWER_SINGLE_LOAN_QUERY: string = `
  query GetLoan($loan_id: Int){
    getLoan(loan_id: $loan_id){
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
      addon_terms
      addon_amount
      addon_udi
      addon_total
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
      acctg_entry {
        id
        reference_no
      }
      user {
        branch_sub_id
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
        agent_fee
        collection
        insurance
        notarial
      }
      deduction_rate {
        udi
        processing
        agent_fee
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
      addon_terms
      addon_udi_rate
      addon_amount
      addon_udi
      addon_total
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
const LOAN_PN_SIGNING: string = `
  mutation SignPNLoan($input: InputPNSigning){
    signPNLoan(input: $input){
      success
      message
    }
  }
`;
const SAVE_LOAN_BANK_DETAILS: string = `
  mutation SaveLoanBankDetails($input: InputLoanBankDetails){
    saveLoanBankDetails(input: $input){
      success
      message
      data {
        loan_bank_details {
          account_name
        }
      }
    }
  }
`;
const SAVE_LOAN_RELEASE: string = `
  mutation SaveReleaseLoan($input: InputLoanRelease){
    saveReleaseLoan(input: $input){
      success
      message
      data {
        released_date
      }
    }
  }
`;
const PRINT_LOAN_DETAILS: string = `
    mutation PrintLoanDetails($input: LoanDetailsInput!){
      printLoanDetails(input: $input)
    }
`;
const GET_LOAN_RENEWAL: string = `
   query GetRenewalBalance($input: RenewalBalanceInp){
    getRenewalBalance(input: $input){
      loan_ref
      pn_amount
      loan_schedules {
        ua_sp {
          amount
          due_date
          loan_schedule_id
        }
        ob {
          amount
          due_date
          loan_schedule_id
        }
      }
    }
  }
`;

const DELETE_LOANS: string = `
   query RemoveLoans($input: LoanIdDeleteInp){
    removeLoans(input: $input) {
      status
      message
    }
  }
`;

const UPDATE_LOAN_RELEASED: string = `
  query UpdateLoanReleasedDate($input: LoanUpReleasedDateInp){
    updateLoanReleasedDate(input: $input) {
      status
      message
    }
  }
`;

const LoanProductsQueryMutations = {
  BORROWER_LOAN_QUERY,
  PROCESS_BORROWER_LOAN_MUTATION,
  APPROVE_LOAN_BY_SCHEDULE,
  BORROWER_SINGLE_LOAN_QUERY,
  LOAN_PN_SIGNING,
  SAVE_LOAN_BANK_DETAILS,
  SAVE_LOAN_RELEASE,
  PRINT_LOAN_DETAILS,
  GET_LOAN_RENEWAL,
  DELETE_LOANS,
  UPDATE_LOAN_RELEASED
};

export default LoanProductsQueryMutations;