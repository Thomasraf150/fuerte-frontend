const GET_ACCOUNTING_DASHBOARD: string = `
  query GetAccountingDashboard($branch_id: Int, $start_date: String!, $end_date: String!) {
    getAccountingDashboard(branch_id: $branch_id, start_date: $start_date, end_date: $end_date) {
      viewing_branch {
        branch_id
        branch_name
      }
      summary {
        total_nr
        total_udi
        total_outstanding
        active_loan_count
        nr_change_percent
        udi_change_percent
        loan_count_change_percent
        outstanding_change_percent
      }
      previous {
        total_nr
        total_udi
        total_outstanding
        active_loan_count
      }
      trend {
        month
        nr_total
        udi_total
      }
      sub_branch_breakdown {
        branch_sub_id
        branch_sub_name
        loan_count
        nr_balance
        udi_balance
      }
    }
  }
`;

const DashboardQueries = {
  GET_ACCOUNTING_DASHBOARD,
};

export default DashboardQueries;
