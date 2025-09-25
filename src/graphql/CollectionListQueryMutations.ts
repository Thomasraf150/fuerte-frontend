const GET_DATA_COLLECTION_LIST: string = `
  query GetCollectionLists($first: Int, $page: Int, $orderBy: [OrderByClause!], $loan_ref: String, $search: String){
    getCollectionLists(first: $first,
      page: $page,
      orderBy: $orderBy,
      loan_ref: $loan_ref,
      search: $search){
      data {
        loan_id
        description
        loan_schedule_id
        due_date
        trans_date
        loan_ref
      }
      paginatorInfo {
        total
        currentPage
        lastPage
        hasMorePages
      }
  }
}
`;
const GET_COLLECTION_ENTRY: string = `
  query getCollectionEntry($input: InpGetColtdPymnt){
    getCollectionEntry(input: $input){
      loan_schedule_id
      loan_udi_schedule_id
      description
      amount
      trans_date
      journal_ref
      account_id
      is_deleted
    }
  }
`;

const SAVE_COLLECTION_ENTRY: string = `
  mutation PostCollectionEntries($loan_payments: [InpColLoanPymnt!]!, $subsidiaries: InpSubsidiariesColEty!){
    postCollectionEntries(loan_payments: $loan_payments, subsidiaries: $subsidiaries) {
      status
      message
    }
  }
`;

const CollectionListQueryMutations = {
  GET_DATA_COLLECTION_LIST,
  GET_COLLECTION_ENTRY,
  SAVE_COLLECTION_ENTRY
};

export default CollectionListQueryMutations;