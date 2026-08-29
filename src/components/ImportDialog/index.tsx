'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, FileText, Download } from 'react-feather';
import { useImport } from '@/hooks/useImport';
import { useAuthStore } from '@/store';
import SampleSheet from './SampleSheet';
import type { ImportTypePayload } from '@/hooks/useImport';

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

/**
 * Authenticated fetch -> blob -> anchor: a bare <a download> cannot carry the
 * Bearer token this endpoint requires. Shared by both download buttons so the
 * token, the revoke delay and the failure message stay in one place.
 *
 * The filename comes from Content-Disposition rather than a local table: the
 * server already names each type's file, and duplicating that here would mean
 * every new import type needs a frontend edit to be downloadable.
 */
async function downloadVariant(type: string, variant: Variant): Promise<void> {
  const token = useAuthStore.getState().GET_AUTH_TOKEN();
  const qs = variant === 'example' ? '?example=1' : '';
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/imports/${type}/template${qs}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  if (!res.ok) throw new Error(`Download failed (${res.status})`);

  const disposition = res.headers.get('Content-Disposition') ?? '';
  const named = /filename="?([^";]+)"?/.exec(disposition)?.[1];

  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = named ?? `Fuerte_${type}_${variant}.xlsx`;
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
  const { listTypes, upload, busy, error, setError } = useImport();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  // Which variant is downloading, so only that button shows its pending label.
  const [tplBusy, setTplBusy] = useState<Variant | null>(null);
  const [types, setTypes] = useState<ImportTypePayload[] | null>(null);
  const [selected, setSelected] = useState<string>('collections');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const active = types?.find((t) => t.type === selected) ?? null;

  // Load the type list once per opening. Types the user's role cannot use are
  // already filtered out server-side, so whatever arrives is safe to offer.
  useEffect(() => {
    if (!open || types) return;
    let cancelled = false;
    listTypes().then((list) => {
      if (cancelled || !list) return;
      setTypes(list);
      // Keep the current selection if it survived, else fall back to the first
      // type this user actually has.
      if (!list.some((t) => t.type === selected) && list[0]) {
        setSelected(list[0].type);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, types, listTypes, selected]);

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
        await downloadVariant(selected, variant);
      } catch (e: any) {
        setError(e?.message ?? 'Download failed');
      } finally {
        setTplBusy(null);
      }
    },
    [setError, selected],
  );

  const start = useCallback(async () => {
    if (!file) return;
    const res = await upload(file, selected);
    if (res?.batch_ref) {
      onClose();
      router.push(`/imports/${res.batch_ref}`);
    }
  }, [file, upload, onClose, router, selected]);

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
          {/* Only shown once there is a genuine choice — a select with one
              option in it is worse than no select. */}
          {types && types.length > 1 && (
            <div className="space-y-1">
              <label
                htmlFor="import-type"
                className="block text-sm font-medium text-black dark:text-white"
              >
                What are you importing?
              </label>
              <select
                id="import-type"
                value={selected}
                disabled={busy !== null || tplBusy !== null}
                onChange={(e) => {
                  setSelected(e.target.value);
                  // A file chosen for one type must not survive into another.
                  setFile(null);
                  setError(null);
                }}
                className="min-h-[48px] w-full rounded-lg border border-stroke bg-white px-3 text-sm text-black focus:border-primary focus:outline-none disabled:opacity-50 dark:border-strokedark dark:bg-form-input dark:text-white"
              >
                {types.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.label}
                  </option>
                ))}
              </select>
              {active && (
                <p className="text-xs text-body dark:text-bodydark">{active.description}</p>
              )}
            </div>
          )}

          {active && !active.can_upload ? (
            // No upload step to describe yet, so do not walk the clerk through
            // one — the "download only" note below carries the whole story.
            <p className="text-sm text-body dark:text-bodydark">
              Download the template below and fill it in. Keep the finished file
              safe until uploading is switched on.
            </p>
          ) : (
            <ol className="text-sm text-body dark:text-bodydark space-y-1 list-decimal pl-5">
              <li>Fill in the template below.</li>
              <li>Upload it here — nothing is posted yet.</li>
              <li>Review what the system found, then confirm.</li>
            </ol>
          )}

          {/* Shown before the download buttons on purpose: the clerk learns the
              shape first, so "Download the template" reads as "get this file,
              already in that shape" rather than as a leap of faith.
              The grid is served by the backend from the same column definitions
              the workbook is built from, so it cannot drift from the file. */}
          {active?.sample && <SampleSheet sample={active.sample} />}

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
            empty and ready to type into — that is the one you fill in. The{' '}
            <span className="text-black dark:text-white">example</span> holds
            the rows shown above, already filled in, so you can open it beside
            your own file and compare. Nothing in the example points at a real
            record, so it cannot change anything if you upload it by mistake.
          </p>

          {active && !active.can_upload && (
            <p className="rounded border border-warning/40 bg-warning/5 px-3 py-2 text-xs leading-snug text-black dark:text-white">
              <span className="font-medium">Download only for now.</span>{' '}
              {active.label} files cannot be uploaded yet — the template is here
              so your office can start filling it in while that is built.
            </p>
          )}

          {(active ? active.can_upload : true) && (
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
          )}

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
            disabled={!file || busy !== null || !(active ? active.can_upload : true)}
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
