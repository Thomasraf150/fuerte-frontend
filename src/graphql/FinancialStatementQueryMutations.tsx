const GET_BALANCE_SHEET: string = `
  query GetBalanceSheet($date: String){
    getBalanceSheet(date: $date) {
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
        }
        equity {
            number
            account_name
            balance
        }
        total_assets
        total_liabilities
        total_equity
    }
  }
`;

const GET_INCOME_STATEMENT: string = `
  query GetIncomeStatement($startDate: String, $endDate: String){
    getIncomeStatement(startDate: $startDate, endDate: $endDate) {
        revenues {
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
        expenses {
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
        total_revenue
        total_expense
        net_income
    }
  }
`;

const FinancialStatementQueryMutations = {
  GET_BALANCE_SHEET,
  GET_INCOME_STATEMENT
};

export default FinancialStatementQueryMutations;