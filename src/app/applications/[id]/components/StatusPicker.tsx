"use client";

import React, { useId } from 'react';
import { Check, ChevronDown, RotateCw, Save } from 'react-feather';
import { APPLICATION_STATUS_DOT, APPLICATION_STATUS_LABEL } from '@/app/applications/components/ApplicationStatusPill';
import type { PickableStatus } from '@/hooks/useLoanApplication';
import type { LoanApplicationStatus } from '@/utils/DataTypes';
import type { StatusDraft } from './useStatusDraft';

/** The three statuses staff switch between, freely and in any order. */
const PICKABLE: readonly PickableStatus[] = ['for_interview', 'interviewed', 'declined'];

const RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark';

/** How the Save status button looks in each of its four states. Whole class names, so that Tailwind sees them. */
const LOOK = {
  /** A choice waits: the page's filled blue, the one thing to press (Create as borrower says "Save the status first."). */
  pending: 'bg-primary text-white hover:bg-opacity-90',
  /** The post is out. */
  saving: 'cursor-progress bg-primary bg-opacity-80 text-white',
  /** Saved a moment ago: the confirmation, in the button where the eyes already are. */
  saved: 'border border-success/50 bg-success/10 text-black dark:text-white',
  /** Nothing to save: quiet, still reachable by keyboard. */
  idle: 'cursor-not-allowed border border-stroke bg-transparent text-bodydark2 dark:border-strokedark',
} as const;

interface SaveStatusButtonProps {
  /** The choice differs from the saved status. */
  pending: boolean;
  saving: boolean;
  /** The status was saved a moment ago. */
  saved: boolean;
  /** The id of the paragraph that says why the last save was refused, while there is one: the button's description. */
  describedBy: string | undefined;
  onSave: () => void;
}

/**
 * Saves the status, and is where staff see that it was saved. "Save status" while a choice
 * waits, "Saving…" while the post is out (aria-busy; it ignores clicks, but keeps focus:
 * aria-disabled, not disabled, as Print does, because a second click would be a second post),
 * then "Saved" for a few seconds, then quiet again. The confirmation is in the button, not a
 * label beside it: from md up the toolbar is one tight row, and a label would push Print and
 * Create as borrower onto a second row at the very moment Create becomes available. 48px tall
 * on a phone, where it is a full-width row (the group around it wraps). The disk icon is for
 * phones only: from md up the words are enough, and the room goes to the row.
 */
const SaveStatusButton: React.FC<SaveStatusButtonProps> = ({ pending, saving, saved, describedBy, onSave }) => {
  const look = saving ? LOOK.saving : pending ? LOOK.pending : saved ? LOOK.saved : LOOK.idle;
  return (
    <button
      type="button"
      aria-disabled={!pending || saving}
      aria-busy={saving}
      aria-describedby={describedBy}
      onClick={() => {
        if (pending && !saving) onSave();
      }}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded px-3 text-sm font-medium transition-colors md:min-h-10 md:w-auto ${RING} ${look}`}
    >
      {saving ? (
        <RotateCw aria-hidden="true" size={16} className="shrink-0 motion-safe:animate-spin" />
      ) : pending || !saved ? (
        <Save aria-hidden="true" size={16} className="shrink-0 md:hidden" />
      ) : (
        <Check aria-hidden="true" size={16} className="shrink-0 text-success" />
      )}
      {saving ? 'Saving…' : pending || !saved ? 'Save status' : 'Saved'}
    </button>
  );
};

interface StatusPickerProps {
  /** The saved status. The record's, never the choice on screen. */
  status: LoanApplicationStatus;
  /** The choice not yet saved, and the one post that saves it (useStatusDraft). */
  draft: StatusDraft;
  /**
   * The application is a borrower already (the page's one check, notConvertibleReason: the
   * status Borrower created, or a borrower linked). The server refuses every change of it, so
   * the select is fixed on the status it has, and there is nothing to save.
   */
  locked: boolean;
  /** The id of the toolbar's paragraph that says why the last save was refused (it exists only while there is a refusal). */
  errorId: string;
}

/**
 * The status: a select that holds a choice, and beside it the button that saves it. The select
 * is the system's own picker, with the status's dot and name: the right control for a phone (the
 * OS's big list, no popover to clip) and for a keyboard, with nothing to rebuild. Changing it
 * saves nothing (an arrow key on a closed select changes it with every press); the choice waits
 * for "Save status". While the post is out the select is disabled, so it cannot change under it.
 * An unsaved choice draws the select's edge amber. A converted application's status is fixed
 * ("Borrower created" is only set by Create as borrower): the select is disabled, with no button.
 *
 * Rendered as two children of the toolbar's row: the select's field, and the button. From md up
 * they sit side by side; on a phone the button wraps under the field (the row has flex-wrap) as a
 * full-width, 48px row.
 */
const StatusPicker: React.FC<StatusPickerProps> = ({ status, draft, locked, errorId }) => {
  const id = useId();
  const { shown, pending, saving, justSaved, choose, save } = draft;
  /** Only a status of Borrower created has an option of its own: the others are the three to choose from. */
  const hasBorrowerOption = status === 'borrower_created';

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none">
        <label htmlFor={id} className="text-[11px] font-medium uppercase tracking-[0.08em] text-body dark:text-bodydark">
          Status
        </label>
        <div className="relative min-w-0 flex-1 md:flex-none">
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-4 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${APPLICATION_STATUS_DOT[shown] ?? 'bg-body'}`}
          />
          <select
            id={id}
            value={shown}
            disabled={locked || saving}
            onChange={(event) => choose(event.target.value as PickableStatus)}
            className={`h-12 w-full appearance-none rounded border bg-white pl-9 text-sm font-medium text-black transition-colors hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-whiten disabled:text-body disabled:opacity-100 disabled:hover:border-stroke dark:bg-boxdark dark:text-white dark:focus-visible:ring-offset-boxdark dark:disabled:bg-meta-4 dark:disabled:text-bodydark md:h-10 md:w-auto md:min-w-[10rem] ${
              pending ? 'border-warning ring-1 ring-warning/60 dark:border-warning' : 'border-stroke dark:border-strokedark'
            } ${locked ? 'pr-4' : 'pr-10'}`}
          >
            {hasBorrowerOption && <option value="borrower_created">{APPLICATION_STATUS_LABEL.borrower_created}</option>}
            {PICKABLE.map((option) => (
              <option key={option} value={option}>
                {APPLICATION_STATUS_LABEL[option]}
              </option>
            ))}
          </select>
          {!locked && <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-bodydark2" />}
        </div>
      </div>
      {!locked && (
        <SaveStatusButton pending={pending} saving={saving} saved={justSaved} describedBy={draft.error ? errorId : undefined} onSave={save} />
      )}
    </>
  );
};

export default StatusPicker;
