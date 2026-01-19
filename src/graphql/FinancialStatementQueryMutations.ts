const GET_BALANCE_SHEET: string = `
  query GetBalanceSheet($startDate: String, $endDate: String, $branch_sub_id: String){
    getBalanceSheet(startDate: $startDate, endDate: $endDate, branch_sub_id: $branch_sub_id) {
        assets {
            number
            account_name
            balance
            subAccounts {
                number
                account_name
                balance
                subAccounts {
                    number
                    account_name
                    balance
                }
            }
        }
        liabilities {
            number
            account_name
            balance
            subAccounts {
                number
                account_name
                balance
                subAccounts {
                    number
                    account_name
                    balance
                }
            }
        }
        equity {
            number
            account_name
            balance
            subAccounts {
                number
                account_name
                balance
                subAccounts {
                    number
                    account_name
                    balance
                }
            }
        }
        total_assets
        total_liabilities
        total_equity
    }
  }
`;

const GET_INCOME_STATEMENT: string = `
  query GetIncomeStatement($startDate: String, $endDate: String, $branch_sub_id: String){
    getIncomeStatement(startDate: $startDate, endDate: $endDate, branch_sub_id: $branch_sub_id)
  }
`;

const PRINT_INCOME_STATEMENT: string = `
  mutation PrintIncomeStatement($startDate: String!, $endDate: String!, $branch_sub_id: String!, $show_breakdown: Boolean){
    printIncomeStatement(startDate: $startDate, endDate: $endDate, branch_sub_id: $branch_sub_id, show_breakdown: $show_breakdown) {
      url
      filename
      size
    }
  }
`;

/**
 * Income Statement with optional sub-branch breakdown.
 * Used when user selects "All Sub-Branches" and toggles breakdown view.
 */
const GET_INCOME_STATEMENT_WITH_BREAKDOWN: string = `
  query GetIncomeStatementWithBreakdown($startDate: String, $endDate: String, $show_breakdown: Boolean){
    getIncomeStatementWithBreakdown(startDate: $startDate, endDate: $endDate, show_breakdown: $show_breakdown) {
      interest_income
      other_revenues
      direct_financing
      less_expense
      other_income_expense
      income_tax
      interest_income_by_branch
      other_revenues_by_branch
      direct_financing_by_branch
      less_expense_by_branch
      other_income_expense_by_branch
      income_tax_by_branch
    }
  }
`;

const FinancialStatementQueryMutations = {
  GET_BALANCE_SHEET,
  GET_INCOME_STATEMENT,
  GET_INCOME_STATEMENT_WITH_BREAKDOWN,
  PRINT_INCOME_STATEMENT
};

export default FinancialStatementQueryMutations;