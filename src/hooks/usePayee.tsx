"use client"

import { useCallback, useEffect, useState } from 'react';
import VendorQueryMutations from '@/graphql/VendorQueryMutations';
import { graphqlFetch } from '@/utils/graphqlFetch';
import { toast } from 'react-toastify';

export interface PayeeOption {
  id: string;
  name: string;
}

/**
 * Payee list + inline create for the Check Voucher payee combobox.
 *
 * Deliberately NOT part of useVendor, for two reasons:
 *  1. useVendor's mount effect fires FOUR queries (vendor types, supplier
 *     categories, customer categories, departments). None of them are needed to
 *     pick a payee, and local /fuerte-api requests carry a ~5.4s latency floor,
 *     so reusing it would tax every voucher form mount for nothing.
 *  2. useVendor.createVendor ALWAYS sends `id`, which routes the resolver into
 *     its by-id branch — a full-row overwrite that nulls every column not sent.
 *     Creating a payee must never be able to do that to an existing vendor, so
 *     this hook posts a minimal input with no `id` key at all.
 *
 * PayeeView and the vendors page keep using useVendor untouched.
 */
/**
 * @param enabled Skip the fetch entirely when the payee control cannot be used
 *   (a saved voucher renders it read-only). Avoids pulling the whole payee list
 *   on every voucher the user merely opens to look at.
 */
const usePayee = (enabled: boolean = true) => {
  const { GET_ALL_PAYEES_QUERY, CREATE_VENDOR_QUERY } = VendorQueryMutations;

  const [payees, setPayees] = useState<PayeeOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [loadFailed, setLoadFailed] = useState<boolean>(false);

  /** Every live payee, all categories, id + name only. */
  const fetchPayees = useCallback(async () => {
    setLoading(true);
    try {
      const result = await graphqlFetch(GET_ALL_PAYEES_QUERY, { input: {} });
      // graphqlFetch resolves rather than throws on a GraphQL-level error, so an
      // unauthenticated or failed query would otherwise land here as "no payees".
      if (result?.errors?.length) {
        throw new Error(result.errors[0].message);
      }
      const rows = result?.data?.getVendors;
      if (!Array.isArray(rows)) {
        throw new Error('Unexpected payee list response');
      }
      setPayees(rows.filter((r: PayeeOption) => r?.id && r?.name));
      setLoadFailed(false);
    } catch {
      // Record the failure. An empty list is NOT a safe fallback here: the
      // duplicate guard dedupes against this list, so silently continuing would
      // turn the combobox into a duplicate generator against a table that has no
      // unique index on name. createPayee refuses while this flag is set.
      setPayees([]);
      setLoadFailed(true);
      toast.error('Could not load the payee list. Reload the page before adding a new payee.');
    } finally {
      setLoading(false);
    }
  }, [GET_ALL_PAYEES_QUERY]);

  /**
   * Create a payee from a typed name and return it, so the caller can attach it
   * to the voucher immediately.
   *
   * vendor_type_id is hard-defaulted to '2' (Nontrade) and must NEVER be null:
   * getVendors filters on that column whenever a category is supplied, so a
   * null-typed payee would be invisible in the category picker forever.
   */
  const createPayee = useCallback(
    async (rawName: string): Promise<PayeeOption | null> => {
      const name = rawName.trim().replace(/\s+/g, ' ');
      if (!name) return null;

      // Refuse rather than create blind: with no list loaded we cannot tell
      // whether this payee already exists, and the table has no unique index.
      if (loadFailed) {
        toast.error('Payee list unavailable — reload the page before adding a new payee.');
        return null;
      }

      setCreating(true);
      try {
        const result = await graphqlFetch(CREATE_VENDOR_QUERY, {
          input: { name, vendor_type_id: '2' },
        });

        if (result?.errors?.length) {
          toast.error(result.errors[0].message);
          return null;
        }

        const res = result?.data?.createVendors;
        const ok = res?.status === true || res?.status === 'true';
        if (!ok || !res?.id) {
          toast.error(res?.message || 'Could not add that payee.');
          return null;
        }

        const created: PayeeOption = { id: String(res.id), name };
        // Keep the local list in sync so the new payee is offered back
        // immediately, without another round-trip.
        setPayees((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success(`Payee "${name}" added.`);
        return created;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Network error occurred');
        return null;
      } finally {
        setCreating(false);
      }
    },
    [CREATE_VENDOR_QUERY, loadFailed],
  );

  useEffect(() => {
    if (enabled) fetchPayees();
  }, [enabled, fetchPayees]);

  return { payees, fetchPayees, createPayee, loading, creating, loadFailed };
};

export default usePayee;
