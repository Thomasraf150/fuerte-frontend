'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, FileText, Download } from 'react-feather';
import { useImport } from '@/hooks/useImport';
import { useAuthStore } from '@/store';

/**
 * Step 1-3 of the import flow: pick the file, upload, hand off to the review
 * page at /imports/[batchRef]. Validation, preview and the confirm gate live
 * on that page — a dropped connection resumes by URL, not by reopening a modal.
 *
 * Purpose-built Tailwind dialog: components/Modal has an invalid `max-h-100`
 * body class, no role="dialog" and no focus handling, so it is not reused.
 */
export default function ImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { upload, busy, error, setError } = useImport();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [tplBusy, setTplBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // The overlay's onKeyDown never fired: focus stays on the trigger outside
  // the dialog, so the key event was never in its subtree. Move focus in on
  // open and listen at the document instead — the dialog claims aria-modal,
  // so Escape has to actually work.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && busy === null) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  const pick = useCallback((f: File | null) => {
    setError(null);
    if (!f) return;
    if (!/\.(xlsx|csv)$/i.test(f.name)) {
      // Clear the previous pick too: leaving it selected kept "Upload & check"
      // enabled, so the rejection message described one file while the button
      // would have uploaded an earlier, different one.
      setFile(null);
      setError('Only .xlsx or .csv files can be imported.');
      return;
    }
    setFile(f);
  }, [setError]);

  const start = useCallback(async () => {
    if (!file) return;
    const res = await upload(file);
    if (res?.batch_ref) {
      onClose();
      router.push(`/imports/${res.batch_ref}`);
    }
  }, [file, upload, onClose, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto bg-black/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Import Spreadsheet from a file"
    >
      {/* min-w-0 + max-w-full: without them the dialog keeps its intrinsic
          width in the flex row and gets clipped off-screen on narrow windows
          instead of shrinking. max-h/overflow keeps it usable when short. */}
      <div ref={panelRef} tabIndex={-1} className="w-full min-w-0 max-w-full sm:max-w-xl my-auto max-h-full overflow-y-auto rounded-t-lg sm:rounded-lg bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-default">
        <div className="flex items-center justify-between border-b border-stroke dark:border-strokedark px-6 py-4">
          <h3 className="font-medium text-black dark:text-white">Import Spreadsheet</h3>
          <button
            onClick={onClose}
            disabled={busy !== null}
            aria-label="Close"
            className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg text-body hover:text-black dark:hover:text-white disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <ol className="text-sm text-body dark:text-bodydark space-y-1 list-decimal pl-5">
            <li>Fill in the collections template (one row per installment paid).</li>
            <li>Upload it here — nothing is posted yet.</li>
            <li>Review what the system found, then confirm.</li>
          </ol>

          <button
            disabled={tplBusy}
            onClick={async () => {
              // Authenticated fetch -> blob -> anchor: a bare <a download>
              // cannot carry the Bearer token this endpoint requires.
              setError(null);
              setTplBusy(true);
              try {
                const token = useAuthStore.getState().GET_AUTH_TOKEN();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/imports/collections/template`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                if (!res.ok) throw new Error(`Template download failed (${res.status})`);
                const url = URL.createObjectURL(await res.blob());
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Fuerte_Daily_Collections_TEMPLATE.xlsx';
                document.body.appendChild(a);
                a.click();
                a.remove();
                // Revoking synchronously can abort the download before the
                // browser has read the blob (Firefox, Android WebView — and
                // budget Android is the target here).
                setTimeout(() => URL.revokeObjectURL(url), 60_000);
              } catch (e: any) {
                setError(e?.message ?? 'Template download failed');
              } finally {
                setTplBusy(false);
              }
            }}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-stroke dark:border-strokedark px-5 py-2.5 text-sm text-black dark:text-white hover:border-primary disabled:opacity-50 disabled:cursor-wait"
          >
            <Download size={14} />
            {tplBusy ? 'Preparing template…' : 'Download the template'}
          </button>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              pick(e.dataTransfer.files?.[0] ?? null);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-stroke dark:border-strokedark hover:border-primary'
            }`}
          >
            {file ? (
              <>
                <FileText size={22} className="text-primary" />
                <span className="text-sm font-medium text-black dark:text-white break-all">{file.name}</span>
                <span className="text-xs text-body dark:text-bodydark">{(file.size / 1024).toFixed(0)} KB — tap to change</span>
              </>
            ) : (
              <>
                <Upload size={22} className="text-body dark:text-bodydark" />
                <span className="text-sm text-black dark:text-white">Tap to choose a file, or drag it here</span>
                <span className="text-xs text-body dark:text-bodydark">.xlsx or .csv — up to 250 rows</span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && (
            <div className="rounded border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stroke dark:border-strokedark px-6 py-4">
          <button
            onClick={onClose}
            disabled={busy !== null}
            className="inline-flex min-h-[48px] items-center rounded-lg border border-stroke dark:border-strokedark px-5 py-2.5 text-sm text-black dark:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={start}
            disabled={!file || busy !== null}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={14} />
            {busy === 'upload' ? 'Uploading…' : 'Upload & check'}
          </button>
        </div>
      </div>
    </div>
  );
}
