const CREATE_CV_MUTATION: string = `
  mutation CreateCvEntry($input: CvAcctgEntriesInp){
    createCvEntry(input: $input) {
      message
      status
    }
  }
`;

const GeneralVoucherQueryMutations = {
  CREATE_CV_MUTATION
};

export default GeneralVoucherQueryMutations;