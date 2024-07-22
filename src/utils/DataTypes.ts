export interface DataRow {
  id: number;
  branch: string;
  user: {
    name: string;
  };
}

export interface DataRowClientList {
  id: number;
  name: string;
  user_id: number;
  penalty_rate: number;
}
export interface DataRowLoanTypeList {
  id: number;
  name: string;
}

export interface DataRowLoanCodes {
  id: number;
  code: string;
  description: string;
  loan_client_id: number;
  loan_type_id: number;
  loan_client: {
    id: number;
    name: string;
  };
  loan_type: {
    id: number;
    name: string
  }
}
export interface DataFormLoanCodes {
  id: number;
  code: string;
  description: string;
  loan_client_id: number;
  loan_type_id: number;
}
export interface DataRowLoanProducts {
  id: number;
  loan_code_id: number;
  description: string;
  terms: number;
  interest_rate: number;
  processing: number;
  insurance: number;
  collection: number;
  notarial: number;
  addon: number;
  user_id: number;
  is_active: number;
  loan_code: DataRowLoanCodes
}
export interface DataFormLoanProducts {
  id: number;
  loan_code_id: number;
  description: string;
  terms: number;
  interest_rate: number;
  processing: number;
  insurance: number;
  collection: number;
  notarial: number;
  addon: number;
  user_id: number;
  is_active: number;
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

export interface Reference {
  occupation: string;
  name: string;
  contact_no: string;
}
export interface BorrowerInfo {
  // info
  id?: string;
  chief_id: number;
  amount_applied: number;
  purpose: string;
  firstname: string;
  middlename: string;
  lastname: string;
  terms_of_payment: string;
  residence_address: string;
  is_rent: number;
  other_source_of_inc: string;
  est_monthly_fam_inc: string;
  employment_position: string;
  gender: string;
  photo: string | File | null;
  user_id: number;

  //details
  dob: string;
  place_of_birth: string;
  age: number;
  email: string;
  contact_no: string;
  civil_status: string;

  // spouse details
  work_address: string;
  occupation: string;
  fullname: string;
  company: string;
  dept_branch: string;
  length_of_service: string;
  salary: string;
  company_contact_person: string;
  spouse_contact_no: string;

  // work background
  company_borrower_id: number;
  employment_number: string;
  area_id: string;
  sub_area_id: string;
  station: string;
  term_in_service: string;
  employment_status: string;
  division: string;
  monthly_gross: number;
  monthly_net: number;
  office_address: string;

  // company information
  employer: string;
  company_salary: string;
  contract_duration: string;

  //reference
  reference: {
    occupation: string;
    name: string;
    contact_no: string;
  }[];
}

export interface DataBorrCompanies {
  id?: string;
  user_id: number;
  name: string;
  address: string;
  contact_person: string;
  contact_no: string;
  contact_email: string;
  is_deleted: boolean;
}
export interface DataChief {
  id?: string;
  user_id: number;
  name: string;
  address: string;
  contact_no: string;
  email: string;
  is_active: number;
  is_deleted: boolean;
}
export interface DataArea {
  id?: string;
  branch_sub_id: string;
  user_id: number;
  name: string;
  description: string;
  is_deleted: boolean;
  sub_area: DataSubArea
}

export interface DataSubArea {
  id?: string;
  area_id: string;
  name: string;
  is_deleted: boolean;
  area: DataArea
}


export interface BorrowerRowInfo {
  id?: string;
  user_id: number;
  chief_id: number;
  amount_applied: string;
  purpose: string;
  firstname: string;
  middlename: string;
  lastname: string;
  terms_of_payment: string;
  residence_address: string;
  is_rent: string;
  other_source_of_inc: string;
  est_monthly_fam_inc: string;
  employment_position: string;
  gender: string;
  photo: string;
  is_deleted: string;
  borrower_details: BorrowerDetails;
  borrower_spouse_details: BorrowerSpouseDetails;
  borrower_work_background: BorrowerWorkBackground
  borrower_company_info: BorrowerCompanyInfo;
  borrower_reference: BorrowerReference;
  chief: DataChief
}

export interface BorrowerDetails {
  id?: string;
  dob: string;
  place_of_birth: string;
  age: string;
  email: string;
  contact_no: string;
  civil_status: string;
}
export interface BorrowerSpouseDetails {
  id?: string;
  work_address: string;
  occupation: string;
  fullname: string;
  company: string;
  dept_branch: string;
  length_of_service: string;
  salary: string;
  company_contact_person: string;
  contact_no: string;
}
export interface BorrowerWorkBackground {
  id?: string;
  company_borrower_id: string;
  employment_number: string;
  area_id: string;
  sub_area_id: string;
  station: string;
  term_in_service: string;
  employment_status: string;
  division: string;
  monthly_gross: string;
  monthly_net: string;
  office_address: string;
}
export interface BorrowerCompanyInfo {
  id?: string;
  employer: string;
  salary: string;
  contract_duration: string;
}
export interface BorrowerReference {
  forEach(arg0: (ref: any, index: any) => void): unknown;
  id?: string;
  occupation: string;
  name: string;
  contact_no: string;
}
export interface BorrowerDataAttachments {
  id?: string;
  borrower_id: string;
  user_id: string;
  name: string;
  file_type: string;
  file_path: string;
  is_deleted: string;
}