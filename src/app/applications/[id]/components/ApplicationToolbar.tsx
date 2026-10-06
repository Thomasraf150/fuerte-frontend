"use client";

import React, { useId } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Printer, RotateCw } from 'react-feather';
import type { ActionResult, PickableStatus } from '@/hooks/useLoanApplication';
import { OTHER_BRANCH_REASON, notConvertibleReason, type BranchAccess, type ConversionBlock } from '@/utils/convertApplication';
import type { LoanApplicationRecord } from '@/utils/DataTypes';
import StatusPicker from './StatusPicker';
import { useStatusDraft } from './useStatusDraft';

/** On a phone each button is a full-width, 48px row: two halves would wrap "Create as borrower" onto two lines. */
const BUTTON =
  'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark sm:px-5 md:min-h-10 md:w-auto md:px-4';

/** The look of a button that cannot be pressed yet: dashed and quiet, but still reachable by keyboard. */
const UNAVAILABLE = 'cursor-not-allowed border border-dashed border-stroke bg-whiten text-bodydark2 dark:border-strokedark dark:bg-meta-4';

/**
 * Print and Create as borrower both use the SAVED application: the printout is made on the
 * server from what is stored, and the borrower page loads the stored row. With edits not
 * saved they would leave the form's behind, so both wait for Save.
 */
export const SAVE_FIRST = 'Save your changes first.';

/**
 * The status select holds a choice that is not saved. Create as borrower reads the SAVED status
 * (the server converts only an Interviewed application), so it waits. Print does not: the
 * printout does not carry the status.
 */
export const SAVE_STATUS_FIRST = 'Save the status first.';

const WHAT_IS_MISSING: Record<Exclude<ConversionBlock, 'converted'>, string> = {
  'no-branch': 'Assign a branch first',
  'not-interviewed': 'Set the status to Interviewed first',
  'other-branch': OTHER_BRANCH_REASON,
};

/**
 * Why Create as borrower cannot be pressed yet, or null when it can. Unsaved changes come
 * first, so a branch picked but not saved says to save, not to assign one; then a status
 * choice not saved. The rest is the server's own order (notConvertibleReason, shared with New
 * Borrower): a borrower needs a saved branch, an interview done, and, for anyone but the Owner,
 * the application's branch among their own (`access`: unknown never blocks).
 */
const createReason = (record: LoanApplicationRecord, unsaved: boolean, statusPending: boolean, access: BranchAccess): string | null => {
  if (unsaved) return SAVE_FIRST;
  if (statusPending) return SAVE_STATUS_FIRST;
  const block = notConvertibleReason(record, access);
  return block && block !== 'converted' ? WHAT_IS_MISSING[block] : null;
};

/**
 * Back to the list. A 48px square arrow on a phone, where the status select needs the room;
 * "Applications" in words from md up. The name is the same either way.
 */
const BackLink: React.FC = () => (
  <Link
    href="/applications"
    aria-label="Back to Applications"
    className="inline-flex h-12 w-12 shrink-0 items-center justify-center gap-1.5 rounded border border-stroke text-primary transition-colors hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-strokedark dark:text-bodydark dark:hover:text-white dark:focus-visible:ring-offset-boxdark md:-ml-2 md:h-10 md:w-auto md:border-0 md:px-2 md:text-sm md:font-medium md:hover:border-0 md:hover:text-opacity-80"
  >
    <ArrowLeft aria-hidden="true" size={16} className="shrink-0" />
    <span className="hidden md:inline">Applications</span>
  </Link>
);

interface PrintButtonProps {
  printing: boolean;
  /** Unsaved changes: the printout would not have them. */
  blocked: boolean;
  reasonId: string;
  onPrint: () => void;
}

/**
 * While the PDF is made it reads "Generating…" and ignores clicks, but keeps focus (as
 * Upload does on the list): a second click would open a second window. With unsaved changes
 * it ignores clicks too, and says why. It does not save for you: the window has to open in
 * the click, before anything is awaited, or popup blockers refuse it.
 */
const PrintButton: React.FC<PrintButtonProps> = ({ printing, blocked, reasonId, onPrint }) => (
  <button
    type="button"
    aria-disabled={printing || blocked}
    aria-describedby={blocked ? reasonId : undefined}
    onClick={() => {
      if (!printing && !blocked) onPrint();
    }}
    className={`${BUTTON} ${
      blocked
        ? UNAVAILABLE
        : `border border-stroke bg-white text-black hover:border-primary/50 dark:border-strokedark dark:bg-boxdark dark:text-white ${printing ? 'cursor-progress' : ''}`
    }`}
  >
    {printing ? (
      <RotateCw aria-hidden="true" size={16} className="shrink-0 motion-safe:animate-spin" />
    ) : (
      <Printer aria-hidden="true" size={16} className="shrink-0" />
    )}
    {printing ? 'Generating…' : 'Print Application'}
  </button>
);

/**
 * The page's one filled action. Until it can be pressed it is a dashed, quiet button that
 * stays reachable by keyboard (aria-disabled, not disabled) and points at the reason
 * printed under it, so nobody is left wondering why it does nothing.
 */
const CreateAsBorrower: React.FC<{ id: string; reason: string | null; reasonId: string }> = ({ id, reason, reasonId }) =>
  reason ? (
    <button type="button" aria-disabled="true" aria-describedby={reasonId} className={`${BUTTON} ${UNAVAILABLE}`}>
      Create as borrower
    </button>
  ) : (
    <Link href={`/borrowers/new?application=${id}`} prefetch={false} className={`${BUTTON} bg-primary text-white hover:bg-opacity-90`}>
      Create as borrower
      <ArrowRight aria-hidden="true" size={16} className="shrink-0" />
    </Link>
  );

interface ApplicationToolbarProps {
  record: LoanApplicationRecord;
  /**
   * The application is a borrower already (the page's one check, notConvertibleReason says
   * "converted": the status Borrower created, or a borrower linked): no Create as borrower,
   * and the status is fixed.
   */
  converted: boolean;
  /**
   * The user may see the application but not change it (Marketing on another branch's application,
   * the server's can_edit): the status is shown, fixed, with nothing to save. Print stays.
   */
  viewOnly: boolean;
  /** Everyone but Call Center, which never creates borrowers, and a view-only reader. */
  canCreateBorrower: boolean;
  /** The branches the user may create a borrower in: an application on another branch cannot be converted by them. */
  branchAccess: BranchAccess;
  /** The form holds changes that are not saved, or a save is out. */
  unsaved: boolean;
  /** Posts a status; resolves once the server has answered. */
  onStatus: (next: PickableStatus, reason?: string) => Promise<ActionResult>;
  printing: boolean;
  onPrint: () => void;
}

/**
 * Back, Status (a select and the button that saves it), Print and Create as borrower. A status
 * saved is announced politely, once ("Status saved: Interviewed"). A refusal is announced once
 * too, by the toast the status hook raises; the toolbar shows it as well, in words that stay
 * after the toast is gone in three seconds, but not live (a second live copy would be read twice)
 * and tied to the Save status button as its description. From md up they sit in one row, with the reason
 * Print or Create as borrower is unavailable printed under them. Create as borrower is not
 * offered for an application that is a borrower already (a status of Borrower created, or a
 * borrower id).
 *
 * The status choice lives here, not in the select (useStatusDraft), because Create as borrower
 * has to know about it: while the choice differs from the saved status it says to save it.
 */
export const ApplicationToolbar: React.FC<ApplicationToolbarProps> = ({ record, converted, viewOnly, canCreateBorrower, branchAccess, unsaved, onStatus, printing, onPrint }) => {
  const reasonId = useId();
  const statusErrorId = useId();
  const status = useStatusDraft(record.status, onStatus);
  const showCreate = canCreateBorrower && !converted;
  const reason = showCreate ? createReason(record, unsaved, status.pending, branchAccess) : unsaved ? SAVE_FIRST : null;

  return (
    <div
      role="group"
      aria-label="Application actions"
      className="flex flex-col gap-3 rounded-sm border border-stroke bg-white p-3 shadow-default dark:border-strokedark dark:bg-boxdark md:flex-row md:flex-wrap md:items-start md:gap-x-4 md:px-5"
    >
      <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:gap-4">
        <BackLink />
        <StatusPicker status={record.status} draft={status} locked={converted || viewOnly} errorId={statusErrorId} />
      </div>
      <div className="flex flex-col gap-2 md:ml-auto md:items-end">
        <div className="flex flex-col gap-2 md:flex-row md:gap-3">
          <PrintButton printing={printing} blocked={unsaved} reasonId={reasonId} onPrint={onPrint} />
          {showCreate && <CreateAsBorrower id={record.id} reason={reason} reasonId={reasonId} />}
        </div>
        {reason && (
          <p id={reasonId} className="text-sm text-body dark:text-bodydark md:text-right">
            {reason}
          </p>
        )}
      </div>
      {/* The one live region of the status: always in the page, empty until it has something to say. */}
      <p role="status" className="sr-only">
        {status.announcement}
      </p>
      {/* A refusal, for whoever misses the toast: visible, not live, and the Save status button's description. */}
      {status.error && (
        <p id={statusErrorId} className="w-full text-sm text-danger">
          {status.error}
        </p>
      )}
    </div>
  );
};
