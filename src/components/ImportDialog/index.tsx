'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, FileText, Download } from 'react-feather';
import { useImport } from '@/hooks/useImport';
import { useAuthStore } from '@/store';
import SampleSheet from './SampleSheet';

/**
 * Step 1-3 of the import flow: pick the file, upload, hand off to the review
 * page at /imports/[batchRef]. Validation, preview and the confirm gate live
 * on that page — a dropped connection resumes by URL, not by reopening a modal.
 *
 * Purpose-built Tailwind dialog: components/Modal has an invalid `max-h-100`
 * body class, no role="dialog" and no focus handling, so it is not reused.
 */

/** Which of the two .xlsx variants the endpoint should return. */
type Variant = 'template' | 'example';

const FILENAMES: Record<Variant, string> = {
  template: 'Fuerte_Daily_Collections_TEMPLATE.xlsx',
  example: 'Fuerte_Daily_Collections_EXAMPLE.xlsx',
};

/**
 * Authenticated fetch -> blob -> anchor: a bare <a download> cannot carry the
 * Bearer token this endpoint requires. Shared by both download buttons so the
 * token, the revoke delay and the failure message stay in one place.
 */
async function downloadVariant(variant: Variant): Promise<void> {
  const token = useAuthStore.getState().GET_AUTH_TOKEN();
  const qs = variant === 'example' ? '?example=1' : '';
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/imports/collections/template${qs}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  if (!res.ok) throw new Error(`Download failed (${res.status})`);

  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = FILENAMES[variant];
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking synchronously can abort the download before the browser has read
  // the blob (Firefox, Android WebView — and budget Android is the target).
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
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
  // Which variant is downloading, so only that button shows its pending label.
  const [tplBusy, setTplBusy] = useState<Variant | null>(null);
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

  const getFile = useCallback(
    async (variant: Variant) => {
      setError(null);
      setTplBusy(variant);
      try {
        await downloadVariant(variant);
      } catch (e: any) {
        setError(e?.message ?? 'Download failed');
      } finally {
        setTplBusy(null);
      }
    },
    [setError],
  );

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
    /* z-999999, not z-50: the app header and sidebar are z-999 and the mobile
       hamburger is z-99999, so at z-50 the page chrome painted OVER the top of
       this dialog. It was invisible until the panel grew tall enough to reach
       y=0 — which is every phone now that the sample is shown. */
    <div
      className="fixed inset-0 z-999999 flex items-end sm:items-center justify-center overflow-y-auto bg-black/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Import Spreadsheet from a file"
    >
      {/* min-w-0 + max-w-full: without them the dialog keeps its intrinsic
          width in the flex row and gets clipped off-screen on narrow windows
          instead of shrinking. max-h/overflow keeps it usable when short. */}
      {/* max-w-2xl (was xl) so the seven sample columns fit without sideways
          scrolling once there is room for them; max-w-full still wins on
          narrow screens, where the grid scrolls inside itself instead. */}
      <div ref={panelRef} tabIndex={-1} className="w-full min-w-0 max-w-full sm:max-w-2xl my-auto max-h-full overflow-y-auto rounded-t-lg sm:rounded-lg bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-default">
        {/* Sticky for the same reason as the footer: the title and the close
            button stay reachable once the body scrolls. */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-stroke bg-white px-6 py-4 dark:border-strokedark dark:bg-boxdark">
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

          {/* Shown before the download button on purpose: the clerk learns the
              shape first, so "Download the template" reads as "get this file,
              already in that shape" rather than as a leap of faith. */}
          <SampleSheet />

          {/* Stacked full-width on a phone: side by side, the two labels wrap
              to three lines each and orphan their icons. */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              disabled={tplBusy !== null}
              onClick={() => getFile('template')}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-stroke dark:border-strokedark px-5 py-2.5 text-sm text-black dark:text-white hover:border-primary disabled:opacity-50 disabled:cursor-wait sm:w-auto"
            >
              <Download size={14} />
              {tplBusy === 'template' ? 'Preparing template…' : 'Download the template'}
            </button>
            <button
              disabled={tplBusy !== null}
              onClick={() => getFile('example')}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-stroke dark:border-strokedark px-5 py-2.5 text-sm text-black dark:text-white hover:border-primary disabled:opacity-50 disabled:cursor-wait sm:w-auto"
            >
              <FileText size={14} />
              {tplBusy === 'example' ? 'Preparing example…' : 'Download a filled-in example'}
            </button>
          </div>

          <p className="text-xs leading-snug text-body dark:text-bodydark">
            The <span className="text-black dark:text-white">template</span> is
            empty and ready to type into — that is the one you fill in and
            upload. The{' '}
            <span className="text-black dark:text-white">example</span> holds
            the three rows shown above, already filled in, so you can open it
            beside your own file and compare. Its loan references do not exist
            on purpose, so it cannot post anything if you upload it by mistake.
          </p>

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

        {/* Sticky: the sample makes the body tall enough to scroll on a 360px
            phone, and the primary action must never be the thing that scrolls
            out of reach. Opaque background so the grid doesn't show through. */}
        <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-end gap-2 border-t border-stroke bg-white px-6 py-4 dark:border-strokedark dark:bg-boxdark">
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
