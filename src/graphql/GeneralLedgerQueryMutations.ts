// const CREATE_GV_MUTATION: string = `
//   mutation CreateGvEntry($input: CvAcctgEntriesInp){
//     createGvEntry(input: $input) {
//       message
//       status
//     }
//   }
// `;

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
  // CREATE_GV_MUTATION,
  GET_GL_QUERY
};

export default GeneralLedgerQueryMutations;