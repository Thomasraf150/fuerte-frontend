import { useEffect, useMemo, useState } from 'react';
import { graphqlFetch } from '@/utils/graphqlFetch';
import { BorrLoanRowData, SelectOption } from '@/utils/DataTypes';

/**
 * The products a renewal most likely wants, put at the top of Create Loans' Loan Product list
 * (2026-10-22). Of 1,511 renewals in the data, 99% stayed in the old loan's client group (EPZA,
 * TEACHER, …), 97% used a "Renewal Loan" type product, and 76% kept the old product's terms, while
 * only 33% kept the exact product. So: Renewal-type products of the old loans' client groups,
 * ranked by the words they share with the old product's name (a client group like PRIVATE spans
 * Manila, La Union and Creamline products), then same terms first. Nothing is picked for staff;
 * the suggestions only save them the search.
 *
 * Every product is read (getLoanProducts pages at 200, and there are ~550): the dropdown's own
 * list is only the first 200 by id, which misses most renewal products.
 */

const RENEWAL_PRODUCTS_QUERY = `
  query RenewalProducts($first: Int!, $page: Int!) {
    getLoanProducts(first: $first, page: $page) {
      data {
        id
        description
        terms
        is_active
        loan_code {
          loan_client_id
          loan_client { name }
          loan_type { name }
        }
      }
      paginatorInfo { hasMorePages }
    }
  }
`;

interface ProductRow {
  id: string | number;
  description: string;
  terms: number | null;
  is_active: boolean | number | null;
  loan_code: {
    loan_client_id: number | null;
    loan_client: { name: string } | null;
    loan_type: { name: string } | null;
  } | null;
}

const MAX_SUGGESTIONS = 10;
const MAX_PAGES = 10;

/** Read once per page load: products change rarely, and every renewal opened after the first reuses them. */
let productsOnce: Promise<ProductRow[]> | null = null;

async function readAllProducts(): Promise<ProductRow[]> {
  const all: ProductRow[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await graphqlFetch(RENEWAL_PRODUCTS_QUERY, { first: 200, page });
    const block = result.data?.getLoanProducts;
    if (result.errors || !block) throw new Error(result.errors?.[0]?.message ?? 'No loan products returned');
    all.push(...block.data);
    if (!block.paginatorInfo?.hasMorePages) break;
  }
  return all;
}

/** Words every product name carries, so they say nothing about which product is the old one's kin. */
const COMMON_WORDS = new Set(['NEW', 'LOAN', 'LOANS', 'RENEWAL', 'RELOAN', 'ADDITIONAL', 'MONTH', 'MONTHS', 'MOS', 'WITH', 'INS']);

const nameWords = (description: string): Set<string> =>
  new Set((description.toUpperCase().match(/[A-Z]{3,}/g) ?? []).filter((word) => !COMMON_WORDS.has(word)));

export interface RenewalProductSuggestions {
  /** The group heading over the suggestions, e.g. "Suggested for this renewal: EPZA". */
  label: string;
  options: SelectOption[];
}

const useRenewalProductSuggestions = (oldLoans: BorrLoanRowData[]): RenewalProductSuggestions | null => {
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const renewing = oldLoans.length > 0;

  useEffect(() => {
    if (!renewing || products) return;
    let live = true;
    productsOnce ??= readAllProducts();
    productsOnce.then(
      (all) => { if (live) setProducts(all); },
      (error) => {
        // Suggestions are a convenience: without them the list still searches every product.
        // Forget the failure so the next renewal opened tries again.
        console.error('Renewal product suggestions:', error);
        productsOnce = null;
        if (live) setProducts([]);
      },
    );
    return () => { live = false; };
  }, [renewing, products]);

  return useMemo(() => {
    if (!renewing || !products?.length) return null;

    const oldIds = new Set(oldLoans.map((loan) => String(loan.loan_product?.id ?? loan.loan_product_id)));
    const oldProducts = products.filter((p) => oldIds.has(String(p.id)));
    const clientIds = new Set(oldProducts.map((p) => p.loan_code?.loan_client_id).filter((id) => id != null));
    if (clientIds.size === 0) return null;
    const oldTerms = new Set(oldProducts.map((p) => Number(p.terms)));
    const oldWords = new Set(oldProducts.flatMap((p) => Array.from(nameWords(p.description))));
    const shared = (p: ProductRow) => Array.from(nameWords(p.description)).filter((word) => oldWords.has(word)).length;

    const picks = products
      .filter((p) =>
        p.is_active !== false && p.is_active !== 0
        && clientIds.has(p.loan_code?.loan_client_id ?? null)
        && /renew/i.test(p.loan_code?.loan_type?.name ?? ''),
      )
      .sort((a, b) =>
        shared(b) - shared(a)
        || Number(oldTerms.has(Number(b.terms))) - Number(oldTerms.has(Number(a.terms)))
        || a.description.localeCompare(b.description),
      )
      .slice(0, MAX_SUGGESTIONS);
    if (picks.length === 0) return null;

    const clients = Array.from(new Set(oldProducts.map((p) => p.loan_code?.loan_client?.name).filter(Boolean)));
    return {
      label: `Suggested for this renewal${clients.length ? `: ${clients.join(', ')}` : ''}`,
      options: picks.map((p) => ({ value: String(p.id), label: p.description })),
    };
  }, [renewing, products, oldLoans]);
};

export default useRenewalProductSuggestions;
