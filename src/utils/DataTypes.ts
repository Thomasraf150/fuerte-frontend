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
  udi: number;
  processing: number;
  insurance: number;
  collection: number;
  notarial: number;
  // addon: number;
  base_deduction: number;
  addon_terms: number;
  addon_udi_rate: number;
  user_id: number;
  is_active: number;
  loan_code: DataRowLoanCodes
}
export interface DataFormLoanProducts {
  id: number | '';
  loan_code_id: number | '';
  description: string;
  terms: number | '';
  interest_rate: number | '';
  udi: number | '';
  processing: number | '';
  insurance: number | '';
  collection: number | '';
  notarial: number | '';
  // addon: number | '';
  user_id: number | '';
  base_deduction: number | '';
  addon_terms: number | '';
  addon_udi_rate: number | '';
  is_active: number | '';
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
  role_id: number;
  branchSub: DataSubBranches
  role: Role;
}
export interface Role {
  id?: string;
  name: string;
  code: number;
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
export interface DataRoles {
  id?: string;
  user_id: number;
  code: string;
  name: string;
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
  role_id: number;
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
  branch_sub_id: number;
  user_id: number;
  name: string;
  description: string;
  is_deleted: boolean;
  sub_area: DataSubArea
}
export interface DataBank {
  id?: string;
  branch_sub_id: string;
  name: string;
  address: string;
  phone: string;
  contact_person: string;
  mobile: string;
  email: string
}
export interface DataBank {
  id?: string;
  branch_sub_id: string;
  name: string;
  address: string;
  phone: string;
  contact_person: string;
  mobile: string;
  email: string
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
  user: User
}

export interface BorrowerDetails {
  id?: string;
  dob: string;
  place_of_birth: string;
  age: number;
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
export interface BorrAttachmentsFormValues {
  id?: string;
  borrower_id: number;
  user_id: string;
  name: string;
  file_type: string;
  file_path: string;
  is_deleted: string;
  file: FileList;
}
export interface BorrAttachmentsRowData {
  id?: string;
  borrower_id: number;
  user_id: string;
  name: string;
  file_type: string;
  file_path: string;
  is_deleted: string;
}

export interface BorrCoMakerFormValues {
  id?: string;
  borrower_id: number;
  user_id: number;
  name: string;
  relationship: string;
  marital_status: string;
  address: string;
  birthdate: string;
  contact_no: string;
  is_deleted: string;
}
export interface BorrCoMakerRowData {
  id?: string;
  borrower_id: number;
  user_id: number;
  name: string;
  relationship: string;
  marital_status: string;
  address: string;
  birthdate: string;
  contact_no: string;
  is_deleted: string;
}

export interface DataRowLoanDetails {
  id: string;
  user_id: string;
  loan_id: string;
  description: string;
  debit: string;
  credit: string;
  account_id: string;
}

export interface DataRowLoanPayments {
  id: string;
  description: string;
  amount: number;
}

export interface DataRowLoanSchedules {
  id: string;
  user_id: string;
  loan_id: string;
  amount: number;
  due_date: string;
  loan_payments: DataRowLoanPayments[];
  is_deleted: string;
}
export interface DataRowLoanUdiSchedules {
  id: string;
  user_id: string;
  loan_id: string;
  amount: string;
  due_date: string;
  is_deleted: string;
}
export interface DataRowLoanUdiSchedules {
  id: string;
  user_id: string;
  loan_id: string;
  amount: string;
  due_date: string;
  is_deleted: string;
}
export interface LoanBankFormValues {
  id?: number;
  loan_id: number;
  account_name: string;
  surrendered_bank_id: number;
  issued_bank_id: number;
  surrendered_acct_no: string;
  issued_acct_no: string;
  surrendered_pin: string;
  issued_pin: string;
  is_deleted: number;
}
export interface BorrLoanRowData {
  id: string;
  branch_sub_id: number;
  borrower_id: number;
  user_id: number;
  loan_product_id: number; 
  loan_ref: string;
  term: string;
  monthly: string;
  status: number;
  is_pn_signed: number;
  pn_amount: string;
  loan_proceeds: string;
  pn_balance: string;
  udi_balance: string;
  addon_terms: string;
  addon_amount: string;
  addon_udi: string;
  addon_total: string;
  is_deleted: number;
  created_at: string;
  approved_date: string;
  released_date: string;
  bank_id: string;
  check_no: string;
  is_closed: string;
  loan_product: DataRowLoanProducts;
  loan_details: DataRowLoanDetails[];
  loan_schedules: DataRowLoanSchedules[];
  loan_udi_schedules: DataRowLoanUdiSchedules[];
  loan_bank_details: LoanBankFormValues;
  borrower: BorrowerRowInfo;
}

export interface BorrLoanFormValues {
  id: string;
  branch_sub_id: number;
  borrower_id: number;
  user_id: number;
  loan_product_id: number; 
  term: string;
  pn_amount: string;
  loan_amount: string;
  pn_balance: string;
  udi_balance: string;
  is_deleted: number;
  ob: string;
  penalty: string;
  rebates: string;
}

export interface BorrLoanComputationValues {
  borrower_id: number;
  loan_amount: string;
  branch_sub_id: string;
  loan_product_id: string;
  ob: string;
  penalty: string;
  rebates: string;
  renewal_loan_id: string;
}

export interface ObjDeductions {
  udi: string;
  processing: string;
  collection: string;
  notarial: string;
}

export interface ObjDeductionsRate {
  udi: string;
  processing: string;
  collection: string;
}

export interface BorrLoanComputationRes {
  deductions: ObjDeductions;
  deduction_rate: ObjDeductionsRate;
  total_deductions: string;
  loan_proceeds: string;
  terms: string;
  pn: string;
  monthly_amort: string;
  ob: string;
  rebates: string;
  penalty: string;
  new_loan_proceeds: string;
}
export interface LoanReleaseFormValues {
  id?: string;
  bank_id: string;
  released_date: Date | undefined;
  check_no: string;
}
export interface CollectionFormValues {
  loan_schedule_id: string;
  loan_udi_schedule_id: string;
  collection: string;
  penalty: string;
  bank_charge: string;
  ap_refund: string;
  interest: string;
  ua_sp: string;
  commission_fee: string;
  collection_date: string;
  user_id: string;
}
export interface OtherCollectionFormValues {
  loan_schedule_id: string;
  loan_udi_schedule_id: string;
  collection: string;
  penalty: string;
  bank_charge: string;
  ap_refund: string;
  interest: string;
  commission_fee: string;
  collection_date: string;
  payment_ua_sp: string;
  penalty_ua_sp: string;
  advanced_payment: string;
  user_id: string;
}
export interface CustomerLedgerData {
  loan_id: string;
  loan_schedule_id: string;
  due_date: string;
  date_paid: string;
  debit: string;
  credit: string;
  running_balance: string;
  collection: string;
  ap_refund: string;
  ua_sp: string;
  bank_charge: string;
  penalty: string;
  udi: string;
  payment_ua_sp: string;
  penalty_ua_sp: string;
  advance_payment: string;
}
export interface DataRowCollectionList {
  date_paid: string;
  action: string;
  refno: string;
  borrower: string;
  monthly: string;
  collection: string;
  rebates: string;
  ua_sp: string;
  payment_ua_sp: string;
  advance_payment: string;
  bank_charge: string;
  ap_or_refund: string;
}
export interface DataChartOfAccountList {
  id: string;
  user_id: string;
  branch_sub_id: string;
  account_name: string;
  number: string;
  description: string;
  balance: string;
  is_debit: string;
  subAccounts: DataChartOfAccountList[];
}