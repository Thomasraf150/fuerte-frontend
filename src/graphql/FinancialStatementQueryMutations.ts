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

// {
//     pivotAccountInterestIncome {
//         account_name
//         account_number
//         monthly_values {
//             month
//             value
//         }
//         variance
//     }
//     pivotAccountOtherRevenues {
//         account_name
//         account_number
//         monthly_values {
//             month
//             value
//         }
//         variance
//     }
//     pivotAccountDirectFinCost {
//         account_name
//         account_number
//         monthly_values {
//             month
//             value
//         }
//         variance
//     }
//     pivotAccountLessExpense {
//         account_name
//         account_number
//         monthly_values {
//             month
//             value
//         }
//         variance
//     }
//     pivotAccountOtherIncomeExp {
//         account_name
//         account_number
//         monthly_values {
//             month
//             value
//         }
//         variance
//     }
//     pivotAccountProvForIncomeTax {
//         account_name
//         account_number
//         monthly_values {
//             month
//             value
//         }
//         variance
//     }
// }

const FinancialStatementQueryMutations = {
  GET_BALANCE_SHEET,
  GET_INCOME_STATEMENT
};

export default FinancialStatementQueryMutations;