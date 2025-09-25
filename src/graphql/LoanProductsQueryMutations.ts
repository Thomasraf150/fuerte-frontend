const GET_LOAN_PRODUCT_QUERY: string = `
  query GetLoanProducts($first: Int!, $page: Int!, $orderBy: [OrderByClause!], $search: String){
	 getLoanProducts(first: $first, page: $page, orderBy: $orderBy, search: $search){
      data {
        id
        loan_code_id
        user_id
        description
        terms
        interest_rate
        udi
        processing
        agent_fee
        insurance
        insurance_fee
        commission
        collection
        notarial
        base_deduction
        addon_terms
        addon_udi_rate
        is_active
       	loan_code {
          id
     		code
   	 		}
      }
      paginatorInfo {
        total
        currentPage
        lastPage
        hasMorePages
      }
    }
  }
`;
const SAVE_LOAN_PRODUCT_QUERY: string = `
  mutation CreateLoanProducts($input: LoanProductInput!){
	  createLoanProducts(input: $input){
      loan_code_id
      user_id
      description
      terms
      interest_rate
      udi
      processing
      agent_fee
      insurance
      insurance_fee
      collection
      notarial
      is_active
    }
  }
`;
const UPDATE_LOAN_PRODUCT_QUERY: string = `
  mutation UpdateLoanProducts($input: LoanProductInput!){
	  updateLoanProducts(input: $input){
      loan_code_id
      user_id
      description
      terms
      interest_rate
      udi
      processing
      agent_fee
      insurance
      insurance_fee
      collection
      notarial
      base_deduction
      addon_terms
      addon_udi_rate
      is_active
    }
  }
`;



const LoanProductsQueryMutations = {
  GET_LOAN_PRODUCT_QUERY,
  SAVE_LOAN_PRODUCT_QUERY,
  UPDATE_LOAN_PRODUCT_QUERY
};

export default LoanProductsQueryMutations;