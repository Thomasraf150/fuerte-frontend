"use client";

import { useCallback, useEffect, useState } from 'react';
import { graphqlFetch } from '@/utils/graphqlFetch';

/**
 * Shared helpers for the ATM collection screens.
 *
 * Amounts arrive as decimal strings ("10018.00") and are only ever displayed here, never added up:
 * every total comes from the server (BCMath). So formatting works on the string itself and never
 * goes through a float.
 */

/**
 * "10018.5" -> "10,018.50"; negatives (and `parens`) in parentheses, as on the paper list.
 * Empty for null; with `blankZero`, a zero reads "-" like the paper's empty cells.
 */
export function amt(value: string | null | undefined, opts: { blankZero?: boolean; parens?: boolean } = {}): string {
  if (value === null || value === undefined || value === '') return '';
  const negative = value.trim().startsWith('-');
  const [whole = '0', cents = ''] = value.trim().replace('-', '').split('.');
  const fixedCents = (cents + '00').slice(0, 2);
  if (opts.blankZero && /^0*$/.test(whole) && fixedCents === '00') return '-';
  const grouped = whole.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const text = `${grouped}.${fixedCents}`;
  if (negative || opts.parens) return `(${text})`;
  return text;
}

/** True when a decimal string is above zero. */
export const positive = (value: string | null | undefined): boolean =>
  !!value && /[1-9]/.test(value) && !value.trim().startsWith('-');

/** A peso amount the user typed, cleaned to what the server accepts ("10,018" -> "10018"), or null. */
export function cleanAmount(input: string): string | null {
  const s = input.replace(/[,\s₱]/g, '');
  return /^\d{1,10}(\.\d{1,2})?$/.test(s) ? s : null;
}

/** "2026-10-30" -> "OCTOBER 30, 2026", the paper list's date. */
export function paperDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const month = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'][m - 1];
  return `${month} ${d}, ${y}`;
}

/** Run a query or mutation; GraphQL errors become an Error with the server's message. */
export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const result = await graphqlFetch<T>(query, variables);
  if (result.errors?.length) throw new Error(result.errors[0]?.message || 'The server refused the request.');
  if (!result.data) throw new Error('The server sent no data.');
  return result.data;
}

/** Load once, and again whenever `reload()` is called or the variables change. */
export function useGql<T>(query: string, variables: Record<string, unknown> | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(variables);

  useEffect(() => {
    if (variables === null) return;
    let live = true;
    setLoading(true);
    gql<T>(query, variables).then(
      (d) => { if (live) { setData(d); setError(null); setLoading(false); } },
      (e: unknown) => { if (live) { setError(e instanceof Error ? e.message : String(e)); setLoading(false); } },
    );
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}

/** Read a picked file as a data URI for upload (refund proof). */
export function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('The file could not be read.'));
    reader.readAsDataURL(file);
  });
}
