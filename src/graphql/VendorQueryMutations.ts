
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
      id
    }
  }
`;

/**
 * Lean payee list for the Check Voucher payee combobox: id + name only.
 *
 * Deliberately NOT GET_VENDOR_LIST_QUERY, which pulls 17 scalars plus four
 * relations per row — fetching all ~285 payees through that on every voucher
 * form mount is tens of KB for two fields we actually use. Passing an empty
 * input returns every live payee across all categories (the vendor_type filter
 * is optional server-side).
 */
const GET_ALL_PAYEES_QUERY: string = `
  query GetAllPayees($input: VendorsInpFetch) {
    getVendors(input: $input) {
      id
      name
    }
  }
`;

const VendorQueryMutations = {
  GET_VENDOR_TYPE_QUERY,
  GET_VENDOR_LIST_QUERY,
  GET_ALL_PAYEES_QUERY,
  GET_SUPPLIER_CAT_QUERY,
  GET_CUSTOMER_CAT_QUERY,
  GET_DEPARTMENT_QUERY,
  CREATE_VENDOR_QUERY
};

export default VendorQueryMutations;