const CREATE_AE_MUTATION: string = `
  mutation CreateAeEntry($input: AeAcctgEntriesInp){
    createAeEntry(input: $input) {
      message
      status
    }
  }
`;

const GET_AE_QUERY: string = `
  query GetAdjustingEntries(
    $first: Int
    $page: Int
    $search: String
    $orderBy: [OrderByClause!]
  ){
    getAdjustingEntries(
      first: $first
      page: $page
      search: $search
      orderBy: $orderBy
    ) {
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

const AdjustingEntriesQueryMutations = {
  CREATE_AE_MUTATION,
  GET_AE_QUERY
};

export default AdjustingEntriesQueryMutations;