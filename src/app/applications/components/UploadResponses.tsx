"use client";

import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Clipboard, UploadCloud } from 'react-feather';
import { ApplicationUploadResult } from '@/utils/DataTypes';
import { formatCount } from '@/utils/helper';
import { IntakeFlagMark } from './ApplicationStatusPill';
import { MenuStep, Spinner } from './IntakeControls';
import NewApplicationLinks from './NewApplicationLinks';
import PasteBox from './PasteBox';

interface UploadResponsesProps {
  uploading: boolean;
  pasting: boolean;
  /** A .zip or .csv download, or one response saved as a PDF. */
  onUpload: (file: File) => Promise<ApplicationUploadResult>;
  /** Rows copied from the responses Sheet, exactly as pasted. */
  onPaste: (text: string) => Promise<ApplicationUploadResult>;
  /** Runs after a successful upload or paste so the list shows the new applicants. */
  onUploaded: () => void;
}

/** How the applicants came in: a file (the download or a PDF), or rows pasted from the Sheet. */
type Way = 'upload' | 'paste';

// Neutral on purpose: "New" can be 0 when every row was already here.
const DONE: Record<Way, string> = { upload: 'Upload finished', paste: 'Paste finished' };
const FAILED: Record<Way, string> = { upload: 'Upload failed', paste: 'Paste failed' };
const FALLBACK: Record<Way, string> = {
  upload: 'The upload did not finish. Upload the same file again.',
  paste: 'Adding the pasted rows did not finish. Paste the same rows again.',
};

/** What the last try did, and where it came from: the file's name, or "Pasted rows". */
interface Outcome {
  way: Way;
  source: string;
  result: ApplicationUploadResult;
}

interface Failure {
  way: Way;
  message: string;
}

// Outlined in the primary colour: New application is the list's one filled primary action,
// and this is the second way in. Full width on phones, 48px tall at every size. On the dark
// card the label stays white, as the paste toggle's does. The aria-disabled: variants style
// it while an upload or a paste runs (it is never `disabled`).
const UPLOAD_BUTTON =
  'inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded border border-primary bg-white px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 aria-disabled:cursor-wait aria-disabled:opacity-80 dark:bg-boxdark dark:text-white dark:hover:bg-primary/25 dark:focus-visible:ring-offset-boxdark-2 sm:w-auto sm:px-6';

// The same footprint, outlined, so it reads as the second way in. While its box is open it
// is lit with a primary tint and border, the colour of the box's top rule. On the dark card
// the label stays white: primary text there would be too faint to read.
const PASTE_TOGGLE =
  'inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded border border-stroke bg-white px-3 text-sm font-medium text-black transition-colors hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 aria-expanded:border-primary aria-expanded:bg-primary/10 aria-expanded:text-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:border-primary dark:hover:text-white dark:focus-visible:ring-offset-boxdark-2 dark:aria-expanded:border-primary dark:aria-expanded:bg-primary/25 dark:aria-expanded:text-white sm:w-auto sm:px-6';

/** The two files the upload takes, each written as the path of controls to press. */
const HowTo: React.FC<{ id: string }> = ({ id }) => (
  <dl id={id} className="mt-2 grid max-w-2xl gap-x-4 gap-y-1 text-sm leading-relaxed sm:grid-cols-[auto_1fr] sm:gap-y-2">
    <dt className="text-xs font-semibold uppercase leading-6 tracking-wide text-black dark:text-white">All responses</dt>
    <dd className="text-body dark:text-bodydark">
      In Google Forms: <MenuStep>Responses</MenuStep> →{' '}
      <MenuStep>
        <span aria-hidden="true">⋮</span>
        <span className="sr-only">More options</span>
      </MenuStep>{' '}
      → <MenuStep>Download responses</MenuStep>. Upload that file as it is (the .zip is fine).{' '}
      <span className="font-medium text-black dark:text-white">Upload the whole download each time</span> — only new
      applicants are added.
    </dd>
    <dt className="mt-1 text-xs font-semibold uppercase leading-6 tracking-wide text-black dark:text-white sm:mt-0">One response</dt>
    <dd className="text-body dark:text-bodydark">
      Open the response → <MenuStep>Print</MenuStep> → <MenuStep>Save as PDF</MenuStep>, then upload the PDF.
    </dd>
  </dl>
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

const UploadResult: React.FC<{ outcome: Outcome }> = ({ outcome: { way, source, result } }) => (
  <div className="mt-4 overflow-hidden rounded-2xl border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
    <p className="flex min-w-0 items-center gap-2 px-4 py-3 text-sm">
      <CheckCircle aria-hidden="true" size={16} className="shrink-0 text-success" />
      <span className="shrink-0 font-medium text-black dark:text-white">{DONE[way]}</span>
      <span title={source} className="min-w-0 truncate text-body dark:text-bodydark">
        {source}
      </span>
    </p>
    {/* gap-px over a stroke background draws the hairlines between the figures. */}
    <dl className="grid grid-cols-3 gap-px bg-stroke dark:bg-strokedark">
      <Figure label="New" value={result.added} rule={result.added > 0 ? 'border-t-success' : 'border-t-stroke dark:border-t-strokedark'} />
      <Figure label="Already here" value={result.already_here} rule="border-t-bodydark2" />
      <Figure label="Skipped" value={result.skipped.length} rule={result.skipped.length > 0 ? 'border-t-danger' : 'border-t-stroke dark:border-t-strokedark'} />
    </dl>
    <NewApplicationLinks added={result.new_applications} />
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

/** Server and reader messages are fixed, user-facing sentences, so they are shown verbatim and they stay until the next try. */
const UploadFailure: React.FC<{ failure: Failure }> = ({ failure }) => (
  <div className="mt-4 flex gap-3 rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-black dark:text-white">
    <AlertCircle aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-danger" />
    <div className="min-w-0 break-words">
      <p className="font-semibold">{FAILED[failure.way]}</p>
      <p className="mt-0.5 leading-relaxed">{failure.message}</p>
    </div>
  </div>
);

/**
 * The primary action. It reads "Uploading…" while an upload runs, and while an upload
 * or a paste runs it ignores clicks, but keeps focus.
 */
const UploadButton: React.FC<{ busy: boolean; uploading: boolean; describedBy: string; onChoose: () => void }> = ({
  busy,
  uploading,
  describedBy,
  onChoose,
}) => (
  <button
    type="button"
    onClick={() => {
      if (!busy) onChoose();
    }}
    aria-disabled={busy}
    aria-describedby={describedBy}
    className={UPLOAD_BUTTON}
  >
    {uploading ? <Spinner /> : <UploadCloud aria-hidden="true" size={16} className="shrink-0" />}
    {uploading ? 'Uploading…' : 'Upload Google Form responses'}
  </button>
);

/** The last try's result or failure, and a runner that records either and refreshes the list after a success. */
function useOutcome(onUploaded: () => void) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  // An upload outlives the render that started it. Call the latest refresh: the one
  // captured when the file was chosen reloads that moment's filter, search and page.
  const onUploadedRef = useRef(onUploaded);
  useEffect(() => {
    onUploadedRef.current = onUploaded;
  }, [onUploaded]);

  const run = async (way: Way, source: string, send: () => Promise<ApplicationUploadResult>): Promise<boolean> => {
    setOutcome(null);
    setFailure(null);
    try {
      const result = await send();
      // The persistent result panel below is the one announcement; no toast on top of it.
      setOutcome({ way, source, result });
      onUploadedRef.current();
      return true;
    } catch (error) {
      setFailure({ way, message: error instanceof Error ? error.message : FALLBACK[way] });
      return false;
    }
  };
  return { outcome, failure, run };
}

const UploadResponses: React.FC<UploadResponsesProps> = ({ uploading, pasting, onUpload, onPaste, onUploaded }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  // What an add that finishes later needs to know: is the box still open?
  const pasteOpenRef = useRef(false);
  const { outcome, failure, run } = useOutcome(onUploaded);
  const headingId = useId();
  const hintId = useId();
  const pasteBoxId = useId();

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // so choosing the same file again still fires onChange
    if (file) void run('upload', file.name, () => onUpload(file));
  };
  const showPaste = (open: boolean) => {
    pasteOpenRef.current = open;
    setPasteOpen(open);
  };
  // Closing hands focus back to the button that opened the box.
  const closePaste = () => {
    showPaste(false);
    toggleRef.current?.focus();
  };
  // If staff pressed Cancel while the rows were being added, the box is already closed:
  // the result still shows, but focus stays wherever they have moved on to.
  const addPasted = async (text: string) => {
    if ((await run('paste', 'Pasted rows', () => onPaste(text))) && pasteOpenRef.current) closePaste();
  };

  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-stroke bg-whiter p-3 dark:border-strokedark dark:bg-boxdark-2 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <h4 id={headingId} className="font-semibold text-black dark:text-white">Google Form responses</h4>
          <HowTo id={hintId} />
        </div>
        <input ref={inputRef} id="application-responses-file" type="file" accept=".zip,.csv,.pdf" className="hidden" aria-label="Google Form responses file (.zip, .csv or .pdf)" onChange={handleFile} />
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          <UploadButton busy={uploading || pasting} uploading={uploading} describedBy={hintId} onChoose={() => inputRef.current?.click()} />
          <button ref={toggleRef} type="button" aria-expanded={pasteOpen} aria-controls={pasteOpen ? pasteBoxId : undefined} onClick={() => showPaste(!pasteOpenRef.current)} className={PASTE_TOGGLE}>
            <Clipboard aria-hidden="true" size={16} className="shrink-0" />
            Paste rows from the Sheet
          </button>
        </div>
      </div>
      {pasteOpen && <PasteBox id={pasteBoxId} busy={uploading || pasting} pasting={pasting} onAdd={(text) => void addPasted(text)} onCancel={closePaste} />}
      {/* Both regions stay mounted, so filling them is announced; they are empty and take no space until then. */}
      <div role="alert">{failure && <UploadFailure failure={failure} />}</div>
      <div role="status">{outcome && <UploadResult outcome={outcome} />}</div>
    </section>
  );
};

export default UploadResponses;
