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

const SummaryTicketReports = {
  GET_SUMMARY_TICKET_REPORTS
};

export default SummaryTicketReports;