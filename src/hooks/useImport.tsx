'use client';

import { useCallback, useState } from 'react';
import { useAuthStore } from '@/store';

/**
 * REST client for the bulk-import endpoints (routes/api.php `imports` group).
 *
 * REST, not GraphQL, on purpose: the project's GraphQL Upload scalar is a
 * no-op pass-through and its only consumer expects a base64 data URI — a
 * spec multipart upload through GraphQL is silently ignored server-side.
 *
 * Result-handling contract (copied from useDeleteWithApproval): branch on the
 * PAYLOAD, never on HTTP status alone — several backend paths return 200 with
 * {status:false}.
 */

const API = process.env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:8080/api

export type ImportBatchPayload = {
  batch_ref: string;
  type: string;
  status: string;
  original_filename: string;
  row_count: number;
  ok_count: number;
  error_count: number;
  committed_count: number;
  total_amount: string;
  summary: {
    error_groups?: { message: string; count: number; rows: number[] }[];
    mapping?: Record<string, number>;
    // accounts_swept is collections-only (the GL balance sweep); created and
    // updated come from types that match against existing records.
    commit?: {
      committed?: number;
      failed?: number;
      accounts_swept?: number;
      created?: number;
      updated?: number;
    };
    will_create?: number;
    will_update?: number;
    unchanged?: number;
    reverse?: { removed?: number; note?: string };
    fatal?: string;
    sweep_failed?: boolean;
  } | null;
  validated_at: string | null;
  committed_at: string | null;
  reversed_at: string | null;
  created_at: string | null;
};

/**
 * The on-screen sample grid, built server-side from the same column definitions
 * the .xlsx is generated from — so the picture and the file cannot drift, and a
 * new import type needs no frontend change to get its own sample.
 */
export type ImportSample = {
  columns: { letter: string; name: string; optional: boolean; numeric: boolean }[];
  rows: (string | null)[][];
  /** Excel row of the first typed row — 2, because the header is row 1. */
  firstDataRow: number;
};

export type ImportTypePayload = {
  type: string;
  label: string;
  description: string;
  /** False for a type whose template exists but whose importer does not yet. */
  can_upload: boolean;
  has_template: boolean;
  sample: ImportSample | null;
};

export type ImportRowPayload = {
  sheet_row: number;
  outcome: string;
  messages: [string, string, string][] | null;
  loan_ref: string | null;
  amount: string | null;
  collection_date: string | null;
  remaining_before: string | null;
  interest: string | null;
};

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().GET_AUTH_TOKEN();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function asJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // Non-JSON body (proxy error page, HTML 500) — surface honestly.
    throw new Error(`Server returned ${res.status}: ${text.slice(0, 160)}`);
  }
}

export function useImport() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(label: string, fn: () => Promise<T>): Promise<T | null> => {
    setBusy(label);
    setError(null);
    try {
      return await fn();
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong');
      return null;
    } finally {
      setBusy(null);
    }
  }, []);

  /** Which import types this user may use, with their samples and capabilities. */
  const listTypes = useCallback(
    () =>
      run('types', async () => {
        const res = await fetch(`${API}/imports/types`, { headers: authHeaders() });
        const json = await asJson(res);
        if (json?.status !== true) throw new Error(json?.message ?? 'Could not load import types');
        return json.types as ImportTypePayload[];
      }),
    [run],
  );

  /** Step 1: multipart upload. Returns { batch_ref, warning }. */
  const upload = useCallback(
    (file: File, type: string) =>
      run('upload', async () => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${API}/imports/${type}`, {
          method: 'POST',
          headers: authHeaders(), // no Content-Type — the browser sets the multipart boundary
          body: fd,
        });
        const json = await asJson(res);
        if (json?.status !== true) throw new Error(json?.message ?? 'Upload failed');
        return json as { batch_ref: string; warning: string | null };
      }),
    [run],
  );

  /** Step 2: server-side dry run. Writes nothing. */
  const validate = useCallback(
    (batchRef: string) =>
      run('validate', async () => {
        const res = await fetch(`${API}/imports/${batchRef}/validate`, {
          method: 'POST',
          headers: authHeaders(),
        });
        const json = await asJson(res);
        if (json?.status !== true) throw new Error(json?.message ?? 'Validation failed');
        return json as { ok: number; errors: number; total: string; batch: ImportBatchPayload };
      }),
    [run],
  );

  /** Review payload for /imports/[batchRef]. */
  const show = useCallback(
    (batchRef: string) =>
      run('show', async () => {
        const res = await fetch(`${API}/imports/${batchRef}`, { headers: authHeaders() });
        const json = await asJson(res);
        if (json?.status !== true) throw new Error(json?.message ?? 'Could not load batch');
        // review_fields is field => column label, chosen by the import type's
        // handler. Absent on batches created before it existed, hence optional.
        return json as {
          batch: ImportBatchPayload;
          rows: ImportRowPayload[];
          review_fields?: Record<string, string>;
        };
      }),
    [run],
  );

  /** Step 3: commit — requires re-typing the count and total (the confirm gate). */
  const commit = useCallback(
    (batchRef: string, confirmRows: number, confirmTotal: string) =>
      run('commit', async () => {
        const res = await fetch(`${API}/imports/${batchRef}/commit`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirm_rows: confirmRows, confirm_total: confirmTotal }),
        });
        const json = await asJson(res);
        if (json?.status !== true) throw new Error(json?.message ?? 'Commit failed');
        return json as { committed: number; failed: number; accounts_swept: number; batch: ImportBatchPayload };
      }),
    [run],
  );

  /** Soft-reversal of a committed batch. */
  const reverse = useCallback(
    (batchRef: string) =>
      run('reverse', async () => {
        const res = await fetch(`${API}/imports/${batchRef}/reverse`, {
          method: 'POST',
          headers: authHeaders(),
        });
        const json = await asJson(res);
        if (json?.status !== true) throw new Error(json?.message ?? 'Reversal failed');
        return json as { reversed_entries: number; accounts_swept: number; batch: ImportBatchPayload };
      }),
    [run],
  );

  return { listTypes, upload, validate, show, commit, reverse, busy, error, setError };
}
