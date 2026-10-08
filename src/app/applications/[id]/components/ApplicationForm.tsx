"use client";

import React, { useCallback, useRef, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { AlertCircle, CheckCircle } from 'react-feather';
import LoadError from '@/app/applications/components/LoadError';
import { NAME_INPUTS_IN_CAPITALS } from '@/app/applications/components/nameInputs';
import { useApplicationPicklists } from '@/app/applications/components/useApplicationPicklists';
import BorrowerDetails from '@/app/borrowers/components/TabForm/BorrowerDetails';
import { SAVED_MESSAGE, type ActionResult } from '@/hooks/useLoanApplication';
import useNewApplication from '@/hooks/useNewApplication';
import {
  canCorrectDateApplied, dateAppliedBounds, fromApplicationRecord, submittedDay, type ApplicationFormValues,
} from '@/utils/applicationForm';
import { manilaToday } from '@/utils/sourceTracker';
import type { BorrowerInfo, LoanApplicationRecord, LoanApplicationUpdateInput, SelectOption } from '@/utils/DataTypes';
import { DateAppliedField } from './DateAppliedField';
import { UnsavedChangesWatcher, formSnapshot, picksOf, saveInputFor, type SavedPicks } from './UnsavedChangesWatcher';

const LIST = '/applications';

/** The three this page requires. An imported application may lack an amount or a purpose, so those are not. */
const REQUIRED_FIELDS: ReadonlySet<string> = new Set(['firstname', 'lastname', 'contact_no']);

/**
 * BorrowerDetails shows New Borrower's own assigned-branch picker to a user with several
 * branches. Here it would have no choices, and what it holds is not sent for a user who may
 * not assign: hide it, and show the branch read-only (ReadOnlyBranch) instead.
 */
const HIDE_BRANCH_PICKER = '[&_[data-testid=borrower-branch-picker]]:hidden';

/**
 * This page is used on budget phones, where a touch target is 48px, and BorrowerDetails'
 * own buttons (Save, Back, Add More, Remove) are 38 to 42px and its selects 38px. The form is
 * not edited here, so they are given the height from outside: below md only, and only inside
 * the form, so the branch list's Retry (above it, with a 36px height of its own from md up) is
 * left alone. react-select's control class has two underscores, which Tailwind would read as
 * spaces in a variant: each is escaped, hence String.raw.
 */
const PHONE_TOUCH_TARGETS = String.raw`max-md:[&_form_button]:min-h-12 max-md:[&_form_.react-select\_\_control]:min-h-12`;

const noop = () => {};

interface Notice {
  ok: boolean;
  text: string;
}

/** The branch choices Owner, Admin and Call Center pick from (getApplicationBranches). */
interface BranchChoices {
  /** Undefined while loading; empty after a failed load. */
  choices: SelectOption[] | undefined;
  error: string | null;
  reload: () => void;
}

interface FormProps {
  record: LoanApplicationRecord;
  saving: boolean;
  save: (input: LoanApplicationUpdateInput) => Promise<ActionResult>;
  /** Whether the form holds changes that are not saved: the page keeps Print and Create as borrower off while it does. */
  onDirtyChange: (dirty: boolean) => void;
}

/**
 * BorrowerDetails calls setShowForm(false) after a save that went through, and from its
 * Back button. This page stays open after a save, and Back leaves without asking: only the
 * second navigates. A save marks itself for one tick, which is when the first call arrives.
 * The result of the save is kept for the note under the form, and a save that went through
 * makes what was posted the form's saved state (`markSaved`).
 *
 * The branch (and the day applied) goes with a save only when it was changed in this form:
 * `saved` holds the picks as the form was loaded, then as it was last saved (see saveInputFor).
 * It is not what the server answers with: a page that went stale must not send its old branch
 * back over a colleague's move.
 *
 * "Saved." says the form is saved. When the form has moved on from what the save posted (it was
 * edited while the save was out), the page already says "Save your changes first." and "Saved."
 * beside it would contradict it, so a save that went through says nothing under the form then
 * (the toast still says the save went through). A refusal is always said.
 */
const useSaveAndStay = (
  save: FormProps['save'],
  mayAssign: boolean,
  loaded: SavedPicks,
  markSaved: (snapshot: string) => void,
) => {
  const router = useRouter();
  const justSaved = useRef(false);
  const saved = useRef(loaded);
  // The form's snapshot as of its last edit; null until it has been edited.
  const lastEdit = useRef<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const submit = async (values: ApplicationFormValues): Promise<ActionResult> => {
    setNotice(null);
    // What was posted, not what the form holds by the time the save answers.
    const posted = formSnapshot(values, mayAssign);
    const result = await save(saveInputFor(values, mayAssign, saved.current));
    if (!result.success) {
      setNotice({ ok: false, text: result.message });
      return result;
    }
    if (lastEdit.current === null || lastEdit.current === posted) setNotice({ ok: true, text: SAVED_MESSAGE });
    markSaved(posted);
    saved.current = picksOf(values);
    justSaved.current = true;
    setTimeout(() => {
      justSaved.current = false;
    }, 0);
    return result;
  };

  const close = (show: boolean): void => {
    if (!show && !justSaved.current) router.push(LIST);
  };

  // The note says how the last save went; once the form is edited again it no longer describes it.
  // The watcher calls this for every edit it sees, a pick in a react-select or a reference row
  // added or removed included: none of those fires a DOM event a wrapper could listen for.
  const edited = useCallback((snapshot: string): void => {
    lastEdit.current = snapshot;
    setNotice(null);
  }, []);

  return { notice, submit, close, edited };
};

/**
 * How the last save went, under the Save button where the eyes already are: a toast is gone in
 * three seconds, and on a phone the top of the page is a long scroll away. It is VISIBLE and
 * NOT live: the toast the save raised (useLoanApplication) is the one announcement, "Saved." or
 * the server's refusal, and a live copy here would be read a second time. Dark text for
 * contrast (text-success is about 3.8:1 on white); the green lives in the icon.
 */
const SaveNotice: React.FC<{ notice: Notice | null }> = ({ notice }) =>
  notice && (
    <div className="flex flex-col items-end px-2 pb-1 text-sm sm:px-4 lg:px-0">
      {notice.ok ? (
        <p data-testid="save-note" data-state="saved" className="inline-flex items-center gap-1.5 font-medium text-black dark:text-white">
          <CheckCircle aria-hidden="true" size={16} className="shrink-0 text-success" />
          {notice.text}
        </p>
      ) : (
        <p data-testid="save-note" data-state="failed" className="inline-flex items-start gap-1.5 text-left font-medium text-danger">
          <AlertCircle aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
          <span className="min-w-0 break-words">{notice.text}</span>
        </p>
      )}
    </div>
  );

/** The branch of a user who may not change it, where the picker would be. */
const ReadOnlyBranch: React.FC<{ name: string | null }> = ({ name }) => (
  <dl>
    <dt className="mb-3 block text-sm font-medium text-black dark:text-white">Branch</dt>
    <dd className="flex h-12 items-center border border-stroke bg-whiten px-4.5 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white md:h-10">
      {name ?? <span className="italic text-body dark:text-bodydark">No branch yet</span>}
    </dd>
    <dd className="mt-2 text-xs text-body dark:text-bodydark">Only the Call Center, Owner and Admin can change the branch.</dd>
  </dl>
);

interface BodyProps extends FormProps {
  /** Null for a user who may not assign a branch. */
  branches: BranchChoices | null;
}

/**
 * The Date applied field: whether this user is offered it for this application, the day it
 * starts on (the Y-m-d of submitted_at), and the bounds of the input (today is Manila's, and is
 * read once: a page left open past midnight keeps yesterday's until it is opened again).
 */
function useDateApplied(record: LoanApplicationRecord, mayAssign: boolean) {
  const shown = canCorrectDateApplied(record, mayAssign);
  const [loadedDay] = useState(() => (shown ? submittedDay(record.submitted_at) : ''));
  const [bounds] = useState(() => dateAppliedBounds(loadedDay, manilaToday()));
  return { shown, loadedDay, bounds };
}

/** The form's starting values: the application's, and, when the date can be corrected, the day it holds. */
const startingValues = (record: LoanApplicationRecord, day: string | null): Partial<BorrowerInfo> => {
  const values = fromApplicationRecord(record);
  return day === null ? values : ({ ...values, submitted_on: day } as Partial<BorrowerInfo>);
};

/**
 * BorrowerDetails in its application variant (hidden photo and Check Borrower), started
 * from the saved application. It reads its starting values once, when it mounts, so the page
 * mounts this only after the record has loaded and keys it by the application.
 * BorrowerDetails' section cards are shared Cards (redesign Phase 1) with no outer margin, so
 * they line up with the header, the actions above and the side panel beside it as they are;
 * the negative margins that used to give back their old 8-12px margins are gone (2026-10-08).
 * The save note and the load error use BorrowerDetails' own inset (px-2 sm:px-4 lg:px-0).
 *
 * `saved` is the form as it was last saved, as a snapshot string: as loaded to begin with,
 * then what each Save posted. The watcher, rendered through renderExtraFields (the only way
 * into the form's `control` without editing BorrowerDetails), compares the form with it.
 */
const ApplicationFormBody: React.FC<BodyProps> = ({ record, saving, save, branches, onDirtyChange }) => {
  const picklists = useApplicationPicklists();
  const dateApplied = useDateApplied(record, branches !== null);
  const [initialValues] = useState(() => startingValues(record, dateApplied.shown ? dateApplied.loadedDay : null));
  const [saved, setSaved] = useState<string | null>(null);
  // The picker starts on the application's own branch (fromApplicationRecord), as the text its options hold.
  const loaded = { branch: String(record.branch_sub_id ?? ''), day: dateApplied.loadedDay };
  const { notice, submit, close, edited } = useSaveAndStay(save, branches !== null, loaded, setSaved);
  // The watcher's verdict also drives the save bar: it is reset by a save, isDirty is not.
  const [unsaved, setUnsaved] = useState(false);
  const dirtyChanged = useCallback((dirty: boolean): void => {
    setUnsaved(dirty);
    onDirtyChange(dirty);
  }, [onDirtyChange]);

  return (
    <div className={`${PHONE_TOUCH_TARGETS} ${NAME_INPUTS_IN_CAPITALS} ${branches ? '' : HIDE_BRANCH_PICKER}`}>
      {branches?.error && (
        <div className="mb-4 px-2 sm:px-4 lg:px-0">
          <LoadError message={branches.error} onRetry={branches.reload} />
        </div>
      )}
      <BorrowerDetails
        {...picklists}
        variant="application"
        initialValues={initialValues}
        requiredFields={REQUIRED_FIELDS}
        // Empty while loading, so New Borrower's own assigned-branch picker never flashes.
        branchChoices={branches ? branches.choices ?? [] : undefined}
        loadingMyAccessibleBranches={branches ? branches.choices === undefined : false}
        // An unassigned application must stay unassigned until someone picks: the first save would assign a preselected home branch.
        preselectHomeBranch={false}
        unsaved={unsaved}
        renderExtraFields={({ control, register, errors }) => (
          <>
            <UnsavedChangesWatcher control={control} mayAssign={branches !== null} saved={saved} onBaseline={setSaved} onDirty={dirtyChanged} onEdit={edited} />
            {dateApplied.shown && <DateAppliedField register={register} error={String(errors.submitted_on?.message ?? '') || undefined} {...dateApplied.bounds} />}
            {!branches && <ReadOnlyBranch name={record.branch_sub?.name ?? null} />}
          </>
        )}
        onSubmitBorrower={submit}
        borrowerLoading={saving}
        singleData={undefined}
        setSingleData={noop}
        setShowForm={close}
        fetchDataBorrower={noop}
      />
      <SaveNotice notice={notice} />
    </div>
  );
};

/** Owner, Admin and Call Center choose the branch from getApplicationBranches; only they load it. */
const AssignableApplicationForm: React.FC<FormProps> = (props) => {
  const { branchChoices, branchError, loadBranches } = useNewApplication();
  return <ApplicationFormBody {...props} branches={{ choices: branchChoices, error: branchError, reload: loadBranches }} />;
};

/** The application's editable form. `mayAssign` is useCanUpload's answer (Admin, Owner and Call Center). */
export const ApplicationForm: React.FC<FormProps & { mayAssign: boolean }> = ({ mayAssign, ...props }) =>
  mayAssign ? <AssignableApplicationForm {...props} /> : <ApplicationFormBody {...props} branches={null} />;
