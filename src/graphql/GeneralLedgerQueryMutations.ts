const GET_GL_QUERY: string = `
  query GetGL($input: GLSearchInp){
    getGL(input: $input){
      account_name
      number
      debit
      credit
    }
  }
`;

const GeneralLedgerQueryMutations = {
  GET_GL_QUERY
};

export default GeneralLedgerQueryMutations;