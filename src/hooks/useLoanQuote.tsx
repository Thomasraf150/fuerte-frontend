'use client';

/**
 * Data layer for the in-office Loan Calculator.
 *
 * Every peso figure comes from the backend `processALoan(process_type: "Compute")`
 * path — the same code that prices a real loan — so a quote can never disagree
 * with the loan that eventually gets booked. Compute writes nothing: its only
 * database access is a single SELECT of the loan product (the
 * `LoanProducts::where('id', ...)` lookup in processALoan). No borrower, loan,
 * or schedule row is created.
 *
 * This deliberately does NOT reuse `useLoans().onSubmitLoanComp`, which returns
 * `true` after toasting a backend failure — a caller that
 * branches on the return reads a false success.
 */

import { useCallback, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/store';
import { fetchWithRecache } from '@/utils/helper';
import { MAX_DROPDOWN_SIZE } from '@/constants/pagination';
import LoansQueryMutation from '@/graphql/LoansQueryMutation';
import LoanProductsQueryMutations from '@/graphql/LoanProductsQueryMutations';
import { branchSubIdForCompute, toManualProductInput } from '@/utils/loanQuote';
import type { ComputeResponse, ManualProduct } from '@/utils/loanQuote';
import type { SelectOption } from '@/utils/DataTypes';

/**
 * What to price: either a saved catalogue product, or an operator-typed rate
 * card for a product that does not exist yet. Exactly one of the two.
 */
export type QuoteRequest =
  | { kind: 'product'; productId: string; amount: string }
  | { kind: 'manual'; manual: ManualProduct; amount: string };

/** The product fields the calculator needs beyond what Compute echoes back. */
export interface QuoteProduct {
  id: string;
  description: string;
  terms: number;
  addon_terms: number | null;
  /** 1 = fees come out of the payout; 0 = fees are added on top of the PN. */
  base_deduction: number;
  is_active: number;
}

interface RawProduct {
  id: string | number;
  description: string;
  terms: string | number;
  addon_terms: string | number | null;
  base_deduction: string | number;
  is_active: string | number | boolean;
}

const toInt = (v: unknown): number => {
  const n = parseInt(String(v ?? '0'), 10);
  return Number.isFinite(n) ? n : 0;
};

/**
 * A product is quotable only if it is active and has a positive term.
 *
 * `terms <= 0` is rejected by the resolver itself (its `empty($lp->terms)` guard),
 * so without this filter the operator picks a product in front of a borrower
 * and gets a red toast. Four live products currently have `terms = 0`.
 */
const isQuotable = (p: RawProduct): boolean =>
  toInt(p.terms) > 0 && (p.is_active === true || toInt(p.is_active) === 1);

const mapProduct = (p: RawProduct): QuoteProduct => ({
  id: String(p.id),
  description: p.description,
  terms: toInt(p.terms),
  addon_terms: p.addon_terms === null ? null : toInt(p.addon_terms),
  base_deduction: toInt(p.base_deduction),
  is_active: toInt(p.is_active),
});

const useLoanQuote = () => {
  const [products, setProducts] = useState<QuoteProduct[]>([]);
  const [productsTruncated, setProductsTruncated] = useState(false);
  const [computing, setComputing] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const latestSearchId = useRef(0);
  /** Guards against a slow earlier Compute overwriting a newer result. */
  const latestComputeId = useRef(0);

  const authHeaders = (): Record<string, string> | null => {
    const { GET_AUTH_TOKEN } = useAuthStore.getState();
    const token = GET_AUTH_TOKEN();
    if (!token) return null;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const requestProducts = useCallback(
    async (search?: string): Promise<QuoteProduct[] | null> => {
      const headers = authHeaders();
      if (!headers) return null;

      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: LoanProductsQueryMutations.GET_LOAN_PRODUCT_QUERY,
          variables: {
            first: MAX_DROPDOWN_SIZE,
            page: 1,
            orderBy: [{ column: 'description', order: 'ASC' }],
            ...(search ? { search } : {}),
          },
        }),
      });

      if (response?.errors?.length) {
        toast.error(`Could not load loan products: ${response.errors[0].message}`);
        return null;
      }

      const page = response?.data?.getLoanProducts;
      if (!page?.data) return null;

      setProductsTruncated(Boolean(page.paginatorInfo?.hasMorePages));
      return (page.data as RawProduct[]).filter(isQuotable).map(mapProduct);
    },
    [],
  );

  /** Load the initial dropdown page. */
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const list = await requestProducts();
      if (list) setProducts(list);
      else if (!authHeaders()) toast.error('Authentication required. Please log in again.');
    } catch {
      toast.error('Failed to load loan products.');
    } finally {
      setLoadingProducts(false);
    }
  }, [requestProducts]);

  /**
   * Server-side type-ahead. 543 products exceed the 200-row dropdown cap, so
   * searching is the only way to reach the rest.
   */
  const searchProducts = useCallback(
    async (input: string): Promise<SelectOption[]> => {
      const asOptions = (list: QuoteProduct[]) =>
        list.map((p) => ({ value: p.id, label: p.description }));

      if (!input || input.length < 2) return asOptions(products);

      const requestId = ++latestSearchId.current;
      try {
        const list = await requestProducts(input);
        // Drop a stale response from an earlier keystroke.
        if (list && requestId === latestSearchId.current) {
          setProducts((prev) => {
            const merged = new Map(prev.map((p) => [p.id, p]));
            list.forEach((p) => merged.set(p.id, p));
            return Array.from(merged.values());
          });
          return asOptions(list);
        }
      } catch {
        /* fall through to the cached list */
      }
      return asOptions(products);
    },
    [products, requestProducts],
  );

  /**
   * Abandon any Compute still on the wire.
   *
   * Clearing the displayed quote in the component is NOT enough: the stale-response
   * guard inside computeQuote is armed only by a *newer* computeQuote call, so an
   * edit that blanks the panel would still let the previous response land and
   * repaint a complete, printable quote for inputs the operator has already
   * changed — with the controls column hidden on the printout, the paper carries
   * no trace of the contradiction. Bumping the id here retires that response.
   *
   * setComputing(false) is required: the abandoned request's `finally` now fails
   * its own id check, so it will never clear the spinner itself.
   */
  const abandonInFlightQuote = useCallback(() => {
    latestComputeId.current += 1;
    setComputing(false);
  }, []);

  /**
   * Price a hypothetical loan. Returns null on any failure (never a false success).
   *
   * Only `loan_product_id` and `loan_amount` affect the result; the other input
   * fields are structurally required by the GraphQL schema. `ob`/`penalty`/
   * `rebates` are read without an isset guard on the PHP side, so they are sent
   * as "0.00" rather than omitted.
   */
  const computeQuote = useCallback(
    async (request: QuoteRequest): Promise<ComputeResponse | null> => {
      const headers = authHeaders();
      if (!headers) {
        toast.error('Authentication required. Please log in again.');
        return null;
      }

      // Read from the Zustand store, not raw localStorage — the existing loan
      // form parses `localStorage.getItem('authStore')` by hand, which breaks
      // silently if the persist shape ever changes.
      const { user } = useAuthStore.getState();
      const userId = user?.id;
      const branchSubId = user?.branch_sub_id;
      const requestId = ++latestComputeId.current;
      setComputing(true);

      try {
        const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: LoansQueryMutation.PROCESS_BORROWER_LOAN_MUTATION,
            variables: {
              process_type: 'Compute',
              input: {
                borrower_id: 0,
                user_id: toInt(userId),
                // loan_product_id is String! in the schema; the resolver ignores
                // it entirely when manual_product is present.
                loan_product_id: request.kind === 'product' ? String(request.productId) : '0',
                loan_amount: request.amount,
                // Must never be "" — see branchSubIdForCompute().
                branch_sub_id: branchSubIdForCompute(branchSubId),
                ob: '0.00',
                penalty: '0.00',
                rebates: '0.00',
                ...(request.kind === 'manual'
                  ? { manual_product: toManualProductInput(request.manual) }
                  : {}),
              },
            },
          }),
        });

        if (requestId !== latestComputeId.current) return null;

        if (response?.errors?.length) {
          toast.error(`Could not compute: ${response.errors[0].message}`);
          return null;
        }

        const data = response?.data?.processALoan as ComputeResponse | null | undefined;
        if (!data) {
          toast.error('The server returned no computation. Please try again.');
          return null;
        }

        // The resolver signals product problems as a payload, not a GraphQL error,
        // and never sets success=true on the happy path — so test for false only.
        if (data.success === false) {
          toast.error(data.message || 'This loan product cannot be computed.');
          return null;
        }

        return data;
      } catch {
        toast.error('Could not reach the server. Check your connection and try again.');
        return null;
      } finally {
        if (requestId === latestComputeId.current) setComputing(false);
      }
    },
    [],
  );

  return {
    products,
    productsTruncated,
    loadingProducts,
    computing,
    loadProducts,
    searchProducts,
    computeQuote,
    abandonInFlightQuote,
  };
};

export default useLoanQuote;
