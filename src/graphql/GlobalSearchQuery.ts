/** Query.globalSearch (fuerte-backend graphql/search.graphql): the top bar's universal search. */
export const GLOBAL_SEARCH_QUERY = `
  query GlobalSearch($term: String!, $group: String, $limit: Int) {
    globalSearch(term: $term, group: $group, limit: $limit) {
      term
      groups {
        key
        title
        has_more
        hits { id title detail kind href tag }
      }
    }
  }
`;

export interface GlobalSearchHit {
  id: string;
  title: string;
  detail: string | null;
  /** borrower | loan | application | payment | cv | jv | ae | crj | vendor | account | atm | import | user | chief | employer | loan_code | loan_product */
  kind: string;
  /** The record page the server picked (the same page its own list opens). */
  href: string;
  /** "Cancelled", "Inactive"; null for a live record. */
  tag: string | null;
}

export interface GlobalSearchGroup {
  key: string;
  title: string;
  has_more: boolean;
  hits: GlobalSearchHit[];
}

export interface GlobalSearchResult {
  term: string;
  /** Only the groups the caller's role may see, in page order. */
  groups: GlobalSearchGroup[];
}

/** Below this the server answers nothing (it refuses one keystroke as "everything"). */
export const GLOBAL_SEARCH_MIN_LENGTH = 2;

/** "Show more" asks the server for one group with up to this many rows (its @rules max). */
export const GLOBAL_SEARCH_MORE_LIMIT = 50;

/** What the box tells staff they can type: the fields the search actually reads. */
export const GLOBAL_SEARCH_PLACEHOLDER = 'Name, mobile no., loan ref, voucher or receipt no., check no., amount';

/** A hit's link, only ever a path inside this app (never an absolute or protocol-relative URL). */
export function globalSearchHref(hit: GlobalSearchHit): string {
  // "//host" and "/\host" are both protocol-relative to a browser.
  return /^\/(?![/\\])/.test(hit.href) ? hit.href : '/search';
}
