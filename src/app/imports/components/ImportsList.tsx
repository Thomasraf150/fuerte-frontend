'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import Link from 'next/link';
import { Eye, Upload } from 'react-feather';
import { formatCurrency } from '@/utils/formatCurrency';
import StatusPill from './StatusPill';
import ImportDialog from '@/components/ImportDialog';
import { useAuthStore } from '@/store';
import type { ImportBatchPayload } from '@/hooks/useImport';

/** Batch history + the "start a new import" entrance. */
export default function ImportsList() {
  const router = useRouter();
  const [batches, setBatches] = useState<ImportBatchPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = useAuthStore.getState().GET_AUTH_TOKEN();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/imports`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json = await res.json();
      if (json?.status !== true) throw new Error(json?.message ?? `Could not load imports (${res.status})`);
      setBatches(json.batches ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load imports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-7 py-4 dark:border-strokedark flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-medium text-black dark:text-white">Bulk imports</h3>
          <p className="text-xs text-body dark:text-bodydark mt-1">
            Upload a filled-in template, check it, then post it. Every batch stays listed here and can be reversed.
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm text-white"
        >
          <Upload size={14} />
          Import Spreadsheet
        </button>
      </div>

      <div className="p-7">
        {error && (
          <div className="mb-4 rounded border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
            <button onClick={load} className="ml-3 underline">Retry</button>
          </div>
        )}
        {loading ? (
          <p className="text-sm text-body dark:text-bodydark">Loading…</p>
        ) : batches.length === 0 && !error ? (
          <p className="text-sm text-body dark:text-bodydark">
            No imports yet. Click “Import Spreadsheet” to start — nothing is posted until you confirm it on the review screen.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-body dark:text-bodydark border-b border-stroke dark:border-strokedark">
                  <th className="py-2 pr-3">Batch</th>
                  <th className="py-2 pr-3">File</th>
                  <th className="py-2 pr-3 text-right">Total</th>
                  <th className="py-2 pr-3 text-right">Rows</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Uploaded</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr
                    key={b.batch_ref}
                    onClick={() => router.push(`/imports/${b.batch_ref}`)}
                    className="cursor-pointer border-b border-stroke dark:border-strokedark last:border-0 hover:bg-gray-2 dark:hover:bg-meta-4"
                  >
                    <td className="py-3 pr-3 font-mono text-xs">{b.batch_ref}</td>
                    <td className="py-3 pr-3 break-all">{b.original_filename}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">{formatCurrency(b.total_amount)}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">
                      {b.ok_count}/{b.row_count}
                    </td>
                    <td className="py-3 pr-3">
                      <StatusPill status={b.status} size="sm" />
                    </td>
                    <td className="py-3 pr-3 text-xs text-body dark:text-bodydark">{b.created_at}</td>
                    <td className="py-3">
                      {/* A real link, not just the row's onClick: gives keyboard
                          users a way in and supports open-in-new-tab. */}
                      <Link
                        href={`/imports/${b.batch_ref}`}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Open batch ${b.batch_ref}`}
                        className="inline-flex min-h-[24px] items-center text-cyan-400 hover:text-cyan-500"
                      >
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ImportDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
