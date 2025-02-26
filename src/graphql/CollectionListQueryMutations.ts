const GET_DATA_COLLECTION_LIST: string = `
  query GetCollectionLists($first: Int, $page: Int, $orderBy: [OrderByClause!], $loan_ref: String){
    getCollectionLists(first: $first,
      page: $page,
      orderBy: $orderBy,
      loan_ref: $loan_ref){
      data {
        loan_id
        description
        due_date
        trans_date
        loan_ref
      } 
  }
}
`;

const CollectionListQueryMutations = {
  GET_DATA_COLLECTION_LIST
};

export default CollectionListQueryMutations;