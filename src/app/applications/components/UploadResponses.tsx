"use client";

import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, UploadCloud } from 'react-feather';
import { ApplicationUploadResult } from '@/utils/DataTypes';
import { formatCount } from '@/utils/helper';
import { IntakeFlagMark } from './ApplicationStatusPill';

interface UploadResponsesProps {
  uploading: boolean;
  onUpload: (file: File) => Promise<ApplicationUploadResult>;
  /** Runs after a successful upload so the list shows the new applicants. */
  onUploaded: () => void;
}

/** What the last upload did, and which file it came from. */
interface Outcome {
  fileName: string;
  result: ApplicationUploadResult;
}

// The page's primary action: full width on phones, 48px tall at every size. The
// aria-disabled: variants style it while uploading (it is never `disabled`).
const UPLOAD_BUTTON =
  'inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 aria-disabled:cursor-wait aria-disabled:bg-opacity-80 dark:focus-visible:ring-offset-boxdark-2 sm:w-auto sm:px-6';

/** One item of Google's menu path, drawn like the control staff will click. */
const MenuStep: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-block whitespace-nowrap rounded border border-stroke bg-white px-1.5 text-xs font-medium leading-5 text-black shadow-card-2 dark:border-strokedark dark:bg-boxdark dark:text-white">
    {children}
  </span>
);

const HowTo: React.FC<{ id: string }> = ({ id }) => (
  <p id={id} className="mt-1.5 max-w-2xl text-sm leading-relaxed text-body dark:text-bodydark">
    In Google Forms: <MenuStep>Responses</MenuStep> →{' '}
    <MenuStep>
      <span aria-hidden="true">⋮</span>
      <span className="sr-only">More options</span>
    </MenuStep>{' '}
    → <MenuStep>Download responses</MenuStep>. Upload that file as it is (the .zip is fine).{' '}
    <span className="font-medium text-black dark:text-white">Upload the whole download each time</span> — only new
    applicants are added.
  </p>
);

/** One figure of the tally. The colour sits on the rule above it, so the numeral stays black or white and legible. */
const Figure: React.FC<{ label: string; value: number; rule: string }> = ({ label, value, rule }) => (
  <div className={`flex flex-col justify-between gap-1 border-t-[3px] bg-white px-3 pb-3 pt-2.5 dark:bg-boxdark sm:px-4 ${rule}`}>
    <dt className="text-xs font-medium uppercase tracking-wide text-body dark:text-bodydark">{label}</dt>
    <dd className="text-title-md font-semibold tabular-nums text-black dark:text-white">{formatCount(value)}</dd>
  </div>
);

const RowNote: React.FC<{ row: number; text: string }> = ({ row, text }) => (
  <li>
    <span className="font-medium tabular-nums">Row {row}</span>: {text}
  </li>
);

const UploadResult: React.FC<{ outcome: Outcome }> = ({ outcome: { fileName, result } }) => (
  <div className="mt-4 overflow-hidden rounded-sm border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
    <p className="flex min-w-0 items-center gap-2 px-4 py-3 text-sm">
      <CheckCircle aria-hidden="true" size={16} className="shrink-0 text-success" />
      <span className="shrink-0 font-medium text-black dark:text-white">Upload finished</span>
      <span title={fileName} className="min-w-0 truncate text-body dark:text-bodydark">
        {fileName}
      </span>
    </p>
    {/* gap-px over a stroke background draws the hairlines between the figures. */}
    <dl className="grid grid-cols-3 gap-px bg-stroke dark:bg-strokedark">
      <Figure label="New" value={result.added} rule={result.added > 0 ? 'border-t-success' : 'border-t-stroke dark:border-t-strokedark'} />
      <Figure label="Already here" value={result.already_here} rule="border-t-bodydark2" />
      <Figure label="Skipped" value={result.skipped.length} rule={result.skipped.length > 0 ? 'border-t-danger' : 'border-t-stroke dark:border-t-strokedark'} />
    </dl>
    {result.skipped.length > 0 && (
      <div className="border-t border-stroke px-4 py-3 dark:border-strokedark">
        <h5 className="text-sm font-semibold text-black dark:text-white">Skipped</h5>
        <ul className="mt-1.5 space-y-1 text-sm text-black dark:text-bodydark1">
          {result.skipped.map((item, index) => (
            <RowNote key={`${item.row}-${index}`} row={item.row} text={item.reason} />
          ))}
        </ul>
      </div>
    )}
    {result.flagged.length > 0 && (
      <div className="border-t border-stroke bg-warning/10 px-4 py-3 dark:border-strokedark">
        <h5 className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
          <IntakeFlagMark />
          Check these
        </h5>
        <p className="mt-0.5 text-xs text-body dark:text-bodydark">Added, but something in these answers looks off.</p>
        <ul className="mt-2 space-y-1 border-l-2 border-warning pl-3 text-sm text-black dark:text-bodydark1">
          {result.flagged.map((item, index) => (
            <RowNote key={`${item.row}-${index}`} row={item.row} text={item.note} />
          ))}
        </ul>
      </div>
    )}
  </div>
);

/** Server messages are fixed, user-facing sentences, so they are shown verbatim and they stay until the next try. */
const UploadFailure: React.FC<{ message: string }> = ({ message }) => (
  <div className="mt-4 flex gap-3 rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-black dark:text-white">
    <AlertCircle aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-danger" />
    <div className="min-w-0 break-words">
      <p className="font-semibold">Upload failed</p>
      <p className="mt-0.5 leading-relaxed">{message}</p>
    </div>
  </div>
);

/** The primary action. While an upload runs it reads "Uploading…" and ignores clicks, but keeps focus. */
const UploadButton: React.FC<{ uploading: boolean; describedBy: string; onChoose: () => void }> = ({
  uploading,
  describedBy,
  onChoose,
}) => (
  <button
    type="button"
    onClick={() => {
      if (!uploading) onChoose();
    }}
    aria-disabled={uploading}
    aria-describedby={describedBy}
    className={UPLOAD_BUTTON}
  >
    {uploading ? (
      <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white border-r-transparent motion-reduce:animate-none" />
    ) : (
      <UploadCloud aria-hidden="true" size={16} className="shrink-0" />
    )}
    {uploading ? 'Uploading…' : 'Upload Google Form responses'}
  </button>
);

const UploadResponses: React.FC<UploadResponsesProps> = ({ uploading, onUpload, onUploaded }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const headingId = useId();
  const hintId = useId();
  // An upload outlives the render that started it. Call the latest refresh: the one
  // captured when the file was chosen reloads that moment's filter, search and page.
  const onUploadedRef = useRef(onUploaded);
  useEffect(() => {
    onUploadedRef.current = onUploaded;
  }, [onUploaded]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // so choosing the same file again still fires onChange
    if (!file) return;
    setOutcome(null);
    setFailure(null);
    try {
      const result = await onUpload(file);
      // The persistent result panel below is the one announcement; no toast on top of it.
      setOutcome({ fileName: file.name, result });
      onUploadedRef.current();
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'The upload did not finish. Upload the same file again.');
    }
  };

  return (
    <section aria-labelledby={headingId} className="rounded-sm border border-stroke bg-whiter p-3 dark:border-strokedark dark:bg-boxdark-2 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <h4 id={headingId} className="font-semibold text-black dark:text-white">Google Form responses</h4>
          <HowTo id={hintId} />
        </div>
        <input ref={inputRef} id="application-responses-file" type="file" accept=".zip,.csv" className="hidden" aria-label="Google Form responses file (.zip or .csv)" onChange={handleFile} />
        <UploadButton uploading={uploading} describedBy={hintId} onChoose={() => inputRef.current?.click()} />
      </div>
      {/* Both regions stay mounted, so filling them is announced; they are empty and take no space until then. */}
      <div role="alert">{failure && <UploadFailure message={failure} />}</div>
      <div role="status">{outcome && <UploadResult outcome={outcome} />}</div>
    </section>
  );
};

export default UploadResponses;
