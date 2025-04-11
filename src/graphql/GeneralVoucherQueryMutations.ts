const CREATE_GV_MUTATION: string = `
  mutation CreateGvEntry($input: CvAcctgEntriesInp){
    createGvEntry(input: $input) {
      message
      status
    }
  }
`;

const GET_GV_QUERY: string = `
  query GetCheckVoucher($input: CvSearchInp){
    getCheckVoucher(input: $input) {
      id
      loan_id
      vendor_id
      journal_no
      journal_name
      journal_ref
      journal_invoice
      journal_date
      posted_date
      check_no
      document_no
      reference_no
      journal_desc
      amount
      user_id
      user_id_posted_by
      user_id_cancelled_by
      is_posted
      is_cancelled
      acctg_details {
        id
        acctg_entries_id
        acctnumber
        debit
        credit
      }
      vendor {
        id
        name
      }
    }
  }
`;

const PRINT_CV_MUTATION: string = `
  mutation PrintAcctgEntries($input: AcctgEntryInput!){
    printAcctgEntries(input: $input)
  }
`;

const GeneralVoucherQueryMutations = {
  CREATE_GV_MUTATION,
  GET_GV_QUERY,
  PRINT_CV_MUTATION
};

export default GeneralVoucherQueryMutations;