const GET_GJ_QUERY: string = `
  query getJournal($input: JvSearchInp){
    getJournal(input: $input) {
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

const GeneralJournalQueryMutations = {
  GET_GJ_QUERY
};

export default GeneralJournalQueryMutations;