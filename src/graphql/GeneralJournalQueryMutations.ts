const GET_GJ_QUERY: string = `
  query getJournal($first: Int, $page: Int, $search: String, $orderBy: [OrderByClause!], $input: JvSearchInp){
    getJournal(first: $first, page: $page, search: $search, orderBy: $orderBy, input: $input) {
      data {
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
        borrower_full_name
        vendor_full_name
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
      paginatorInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`;

const GET_JOURNAL_ENTRY_BY_ID: string = `
  query GetJournalEntryById($id: ID!) {
    getJournalEntryById(id: $id) {
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
      borrower_full_name
    }
  }
`;

const GeneralJournalQueryMutations = {
  GET_GJ_QUERY,
  GET_JOURNAL_ENTRY_BY_ID
};

export default GeneralJournalQueryMutations;