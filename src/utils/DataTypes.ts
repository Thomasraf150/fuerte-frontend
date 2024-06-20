export interface DataRow {
  id: number;
  branch: string;
  user: {
    name: string;
  };
}


export interface DataRowClientList {
  id: number;
  client_name: string;
  penalty: number;
}

export interface DataRowLoanCodes {
  id: number;
  loan_code: string;
  description: string;
  type_of_loan: string;
}