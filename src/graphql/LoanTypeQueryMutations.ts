const GET_LOAN_TYPES_QUERY: string = `
  query GetLoanTypes($orderBy: String!) {
    getLoanTypes(orderBy: $orderBy) {
      id
      name
      is_active
      is_deleted
    }
  }
`;

const CREATE_LOAN_TYPE_MUTATION: string = `
  mutation CreateLoanType($input: LoanTypeInputs!) {
    createLoanType(input: $input) {
      id
      name
      is_active
    }
  }
`;

const UPDATE_LOAN_TYPE_MUTATION: string = `
  mutation UpdateLoanType($input: LoanTypeInputs!) {
    updateLoanType(input: $input) {
      id
      name
      is_active
    }
  }
`;

const DELETE_LOAN_TYPE_MUTATION: string = `
  mutation DeleteLoanType($input: LoanTypeDeleteInput!) {
    deleteLoanType(input: $input) {
      id
    }
  }
`;

const LoanTypeQueryMutations = {
  GET_LOAN_TYPES_QUERY,
  CREATE_LOAN_TYPE_MUTATION,
  UPDATE_LOAN_TYPE_MUTATION,
  DELETE_LOAN_TYPE_MUTATION,
};

export default LoanTypeQueryMutations;
