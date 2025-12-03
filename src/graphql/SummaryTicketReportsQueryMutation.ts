const GET_SUMMARY_TICKET_REPORTS: string = `
  query GetSummaryTicket($input: InputSummaryTix){
    getSummaryTicket(input: $input) {
      summary_tix {
        ccount
        description
        debit
        credit
      }
      summary_tix_net_movement {
        ccount
        description
        amount
      }
      cashout_by_bank {
        bank_name
        loan_count
        total_net_cashout
        total_pn_balance
        total_collection
        total_udi_collection
      }
      loan_type_bdown {
        description
        loan_count
        pn_amount
        loan_proceeds
        udi_balance
      }
    }
  }
`;

const GET_SUMMARY_TICKET_WITH_BREAKDOWN: string = `
  query GetSummaryTicketWithBreakdown($input: InputSummaryTix){
    getSummaryTicketWithBreakdown(input: $input) {
      summary_tix {
        ccount
        description
        debit
        credit
      }
      summary_tix_net_movement {
        ccount
        description
        amount
      }
      cashout_by_bank {
        bank_name
        loan_count
        total_net_cashout
        total_pn_balance
        total_collection
        total_udi_collection
      }
      loan_type_bdown {
        description
        loan_count
        pn_amount
        loan_proceeds
        udi_balance
      }
      summary_tix_by_branch {
        branch_sub_id
        branch_name
        branch_code
        description
        ccount
        debit
        credit
      }
      net_movement_by_branch {
        branch_sub_id
        branch_name
        branch_code
        ccount
        description
        amount
      }
    }
  }
`;

const PRINT_SUMMARY_TIX: string = `
    mutation PrintSummaryDetails($input: SummaryTixInput!){
      printSummaryDetails(input: $input)
    }
`;

const SummaryTicketReports = {
  GET_SUMMARY_TICKET_REPORTS,
  GET_SUMMARY_TICKET_WITH_BREAKDOWN,
  PRINT_SUMMARY_TIX
};

export default SummaryTicketReports;