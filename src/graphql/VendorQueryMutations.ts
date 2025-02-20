
const GET_VENDOR_TYPE_QUERY: string = `
  query GetVendorType($input: VendorTypeInp) {
    getVendorType(input: $input) {
      id
      name
      code
    }
  }
`;

const GET_VENDOR_LIST_QUERY: string = `
  query GetVendors($input: VendorsInpFetch) {
    getVendors(input: $input) {
      id
      vendor_type_id
      customer_category_id
      supplier_category_id
      department_id
      name
      employee_no
      contact_no
      employee_position
      tin
      address
      tax_excempty_date
      remarks
      bill_address
      office_no
      credit_limit
      is_allow_excess_limit
      department {
        id 
        name
      }
      vendor_type {
        id
        name
        code
      }
      customer_category {
        id 
        name
      }
      supplier_category {
        id 
        name
      }
    }
  }
`;

const GET_SUPPLIER_CAT_QUERY: string = `
  query GetSupplierCategory($input: VendorTypeInp){
    getSupplierCategory(input: $input) {
      id
      name
    }
  }
`;

const GET_CUSTOMER_CAT_QUERY: string = `
  query GetCustomerCategory($input: VendorTypeInp){
    getCustomerCategory(input: $input) {
      id
      name
    }
  }
`;

const GET_DEPARTMENT_QUERY: string = `
  query GetDepartment($input: VendorTypeInp){
    getDepartment(input: $input) {
      id
      name
    }
  }
`;

const CREATE_VENDOR_QUERY: string = `
  mutation CreateVendors($input: VendorsInp){
    createVendors(input: $input){
      status
      message
    }
  }
`;

const VendorQueryMutations = {
  GET_VENDOR_TYPE_QUERY,
  GET_VENDOR_LIST_QUERY,
  GET_SUPPLIER_CAT_QUERY,
  GET_CUSTOMER_CAT_QUERY,
  GET_DEPARTMENT_QUERY,
  CREATE_VENDOR_QUERY
};

export default VendorQueryMutations;