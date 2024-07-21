const GET_LOAN_PRODUCT_QUERY: string = `
  query GetLoanProducts($orderBy: String!){
	 getLoanProducts(orderBy: $orderBy){
      id
      loan_code_id
      user_id
      description
      terms
      interest_rate
      processing
      insurance
      commission
      collection
      notarial
      addon
      is_active
     	loan_code {
        id
    		code
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
      processing
      insurance
      collection
      notarial
      addon
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
      processing
      insurance
      collection
      notarial
      addon
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