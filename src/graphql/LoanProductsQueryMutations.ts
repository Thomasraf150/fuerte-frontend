const GET_LOAN_PRODUCT_QUERY: string = `
  query GetLoanProducts($orderBy: String!){
	 getLoanProducts(orderBy: $orderBy){
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

const GET_LOAN_PRODUCTS_BATCH_QUERY: string = `
  query GetLoanProductsBatch($orderBy: String!, $page: Int, $perPage: Int, $pagesPerBatch: Int){
	 getLoanProductsBatch(orderBy: $orderBy, page: $page, perPage: $perPage, pagesPerBatch: $pagesPerBatch){
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
      pagination {
        currentBatch
        totalBatches
        batchStartPage
        batchEndPage
        totalRecords
        hasNextBatch
      }
    }
  }
`;

const LoanProductsQueryMutations = {
  GET_LOAN_PRODUCT_QUERY,
  SAVE_LOAN_PRODUCT_QUERY,
  UPDATE_LOAN_PRODUCT_QUERY,
  GET_LOAN_PRODUCTS_BATCH_QUERY
};

export default LoanProductsQueryMutations;