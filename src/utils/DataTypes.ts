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
  loan_code_id: number;
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

export interface DataCompanyFormValues {
  id?: string;
  company_name: string;
  address: string;
  tin: string;
  company_email: string;
  company_website: string;
  phone_no: string;
  mobile_no: string;
  contact_person: string;
  contact_person_no: string;
  contact_email: string;
  company_logo: FileList;
}
export interface User {
  id: string;
  name: string;
  email: string;
  branch_sub_id: number;
}
export interface DataBranches {
  id?: string;
  name: string;
  user_id: number;
  is_deleted: boolean;
  user: User;
}
export interface DataSubBranches {
  id?: string;
  branch_id: number;
  code: string;
  name: string;
  address: string;
  contact_no: string;
  head_name: string;
  head_contact: string;
  head_email: string;
  ref_ctr_year: number;
  ref_ctr_month: number;
  ref_ctr_day: number;
  ref_no_length: number;
  ref_current_value: number;
  user_id: number;
  is_deleted: boolean;
  user: User;
  branch: DataBranches;
}
export interface DataFormSubBranches {
  id?: string;
  branch_id: number;
  code: string;
  name: string;
  address: string;
  contact_no: string;
  head_name: string;
  head_contact: string;
  head_email: string;
  ref_ctr_year: number;
  ref_ctr_month: number;
  ref_ctr_day: number;
  ref_no_length: number;
  ref_current_value: number;
  user_id: number;
  is_deleted: boolean;
}
export interface DataFormBranch {
  id: string;
  name: string;
  user_id: number;
}
export interface DataFormUser {
  id: string;
  name: string;
  email: string;
  branch_sub_id: number;
  password: string;
  confirm_password: string;
}
export interface AuthStoreData {
  token: string;
  user: {
    id: number;
    name: string;
    // Add other fields as needed
  };
}
export interface PaginatorInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
  hasMorePages: boolean;
}
export interface UserPaginator {
  data: User[];
  paginatorInfo: PaginatorInfo;
}