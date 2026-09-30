"use client";

import React, { useEffect, useId, useRef, useState } from 'react';
import { Key, Spinner } from './IntakeControls';

const ADD_BUTTON =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-opacity-50 aria-disabled:cursor-wait aria-disabled:bg-opacity-80 dark:focus-visible:ring-offset-boxdark';

const CANCEL_BUTTON =
  'inline-flex min-h-12 items-center justify-center rounded border border-stroke bg-white px-5 text-sm font-medium text-black transition-colors hover:border-body focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus-visible:ring-offset-boxdark';

/*
 * A strip of the Sheet: monospace, no wrapping, and a faint rule under every 24px
 * line, so each pasted row sits on its own row and the tabs between cells stay visible.
 * The rules start 8px down (the top padding) and scroll with the text.
 */
const SHEET_STRIP =
  'mt-2 block w-full min-w-0 resize-y rounded border border-stroke bg-whiter bg-[linear-gradient(to_bottom,transparent_23px,theme(colors.stroke)_23px)] bg-[length:100%_24px] bg-[position:0_8px] bg-local px-3 py-2 text-sm leading-6 text-black [font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] [tab-size:4] focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 read-only:cursor-wait dark:border-form-strokedark dark:bg-boxdark-2 dark:bg-[linear-gradient(to_bottom,transparent_23px,theme(colors.strokedark)_23px)] dark:text-white';

interface PasteBoxProps {
  id: string;
  /** An upload or a paste is running: "Add pasted rows" ignores clicks. */
  busy: boolean;
  /** A paste is running: the rows are read-only and the button reads "Adding…". */
  pasting: boolean;
  onAdd: (text: string) => void;
  onCancel: () => void;
}

/**
 * Rows pasted from the responses Sheet. The text goes to the server exactly as
 * pasted: tabs separate the cells, and nothing inside it is trimmed. While the rows
 * are being added, "Add pasted rows" reads "Adding…" and keeps focus, like the upload.
 */
const PasteBox: React.FC<PasteBoxProps> = ({ id, busy, pasting, onAdd, onCancel }) => {
  const [text, setText] = useState('');
  const fieldId = useId();
  const helpId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  // Opening the box is a request to paste: the cursor goes straight to it.
  useEffect(() => {
    fieldRef.current?.focus();
  }, []);
  const empty = text.trim() === '';

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!busy && !empty) onAdd(text);
  };

  return (
    <form id={id} onSubmit={submit} className="mt-4 rounded-sm border border-t-[3px] border-stroke border-t-primary bg-white p-3 dark:border-strokedark dark:border-t-primary dark:bg-boxdark sm:p-4">
      <label htmlFor={fieldId} className="text-sm font-semibold text-black dark:text-white">Rows from the responses Sheet</label>
      <p id={helpId} className="mt-0.5 text-sm leading-relaxed text-body dark:text-bodydark">
        In the responses Sheet, click the row numbers, copy (<Key>Ctrl</Key>+<Key>C</Key>), then paste here. Include the header row if you like.
      </p>
      <textarea
        ref={fieldRef}
        id={fieldId}
        value={text}
        onChange={(event) => setText(event.target.value)}
        readOnly={pasting}
        aria-describedby={helpId}
        rows={5}
        wrap="off"
        spellCheck={false}
        autoComplete="off"
        className={SHEET_STRIP}
      />
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={empty} aria-disabled={busy} className={ADD_BUTTON}>
          {pasting && <Spinner />}
          {pasting ? 'Adding…' : 'Add pasted rows'}
        </button>
        <button type="button" onClick={onCancel} className={CANCEL_BUTTON}>Cancel</button>
      </div>
    </form>
  );
};

export default PasteBox;
