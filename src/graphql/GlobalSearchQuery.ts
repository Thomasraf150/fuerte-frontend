/** Query.globalSearch (fuerte-backend graphql/search.graphql): the top bar's universal search. */
export const GLOBAL_SEARCH_QUERY = `
  query GlobalSearch($term: String!) {
    globalSearch(term: $term) {
      term
      vouchers_included
      borrowers { id title detail kind }
      loans { id title detail kind }
      vouchers { id title detail kind }
    }
  }
`;

export interface GlobalSearchHit {
  id: string;
  title: string;
  detail: string | null;
  /** borrower | loan | cv | jv */
  kind: string;
}

export interface GlobalSearchResult {
  term: string;
  vouchers_included: boolean;
  borrowers: GlobalSearchHit[];
  loans: GlobalSearchHit[];
  vouchers: GlobalSearchHit[];
}

/** Below this the server answers nothing (it refuses one keystroke as "everything"). */
export const GLOBAL_SEARCH_MIN_LENGTH = 2;

/** Where a hit opens: the same record pages the lists open. */
export function globalSearchHref(hit: GlobalSearchHit): string {
  switch (hit.kind) {
    case 'borrower':
      return `/borrowers/${hit.id}`;
    case 'loan':
      return `/loans-list/${hit.id}`;
    default:
      return `/accounting/general-voucher/${hit.id}?type=${hit.kind === 'cv' ? 'cv' : 'jv'}`;
  }
}
