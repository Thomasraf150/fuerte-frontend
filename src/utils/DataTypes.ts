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

export interface DataRowLoanProducts {
  id: number;
  type: string;
  description: string;
  loan_code_desc: string;
  terms: number;
  interest_rate: number;
  process: number;
  insurance: number;
  commission: number;
  notarial: number;
  addon: number;
}