"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'react-toastify';
import LoanApplicationQueries from '@/graphql/LoanApplicationQueries';
import { useDownloadPdf } from '@/hooks/useDownloadPdf';
import { graphqlFetch } from '@/utils/graphqlFetch';
import { NOT_FOUND_MESSAGE, isNotFoundMessage, parseApplicationId } from '@/utils/convertApplication';
import type { LoanApplicationRecord, LoanApplicationStatus, LoanApplicationUpdateInput } from '@/utils/DataTypes';

/** The toast and the notice under the form after a save. */
export const SAVED_MESSAGE = 'Saved.';
const LOAD_FAILED = 'Could not load the application. Please try again.';
const SAVE_FAILED = 'Could not save the application. Please try again.';
const STATUS_FAILED = 'Could not change the status. Please try again.';
const BLANK_BASICS = 'The first name, last name and mobile number cannot be blank.';
/** The statuses staff can choose. "Borrower created" is only ever set by Create as borrower. */
export type PickableStatus = Exclude<LoanApplicationStatus, 'borrower_created'>;

/** What a save or a status change reports. A failure carries the message the user was shown. */
export type ActionResult = { success: true } | { success: false; message: string };

type SetRecord = Dispatch<SetStateAction<LoanApplicationRecord | null>>;

/**
 * What setLoanApplicationStatus returns: the status it set, the borrower once there is one, and
 * what follows from them (the outcome, the decline's reason and the Notes panel's lines).
 */
type StatusReply = Pick<
  LoanApplicationRecord,
  'id' | 'status' | 'borrower_id' | 'outcome' | 'outcome_label' | 'decline_reason' | 'notes'
>;

/** The first GraphQL error's message. graphqlFetch has already put a failed @rules check's own reasons there. */
const firstError = (errors: { message: string }[] | undefined, fallback: string): string | null =>
  errors?.length ? errors[0]?.message || fallback : null;

/** An Error's message, which graphqlFetch and the helpers below write to be shown as they are. */
const errorText = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

/** The application, or an Error whose message the page can show; NOT_FOUND_MESSAGE when there is none. */
async function fetchApplication(id: number): Promise<LoanApplicationRecord> {
  const result = await graphqlFetch<{ getLoanApplication?: LoanApplicationRecord | null }>(
    LoanApplicationQueries.GET_LOAN_APPLICATION_QUERY,
    { id },
  );
  const refused = firstError(result.errors, LOAD_FAILED);
  if (refused) throw new Error(refused);
  const data = result.data;
  // An answer without the field is not "no such application": it is a response to retry.
  if (!data || !('getLoanApplication' in data)) throw new Error('The server returned no application data. Please retry.');
  if (!data.getLoanApplication) throw new Error(NOT_FOUND_MESSAGE);
  return data.getLoanApplication;
}

/** The saved application, or an Error carrying the server's refusal. */
async function postUpdate(id: number, input: LoanApplicationUpdateInput): Promise<LoanApplicationRecord> {
  const result = await graphqlFetch<{ updateLoanApplication: LoanApplicationRecord | null }>(
    LoanApplicationQueries.UPDATE_LOAN_APPLICATION_MUTATION,
    { id, input },
  );
  const refused = firstError(result.errors, SAVE_FAILED);
  if (refused) throw new Error(refused);
  if (!result.data?.updateLoanApplication) throw new Error(SAVE_FAILED);
  return result.data.updateLoanApplication;
}

/** `reason` goes only with declined: the server requires it there and clears it everywhere else. */
async function postStatus(id: number, status: PickableStatus, reason?: string): Promise<StatusReply> {
  const result = await graphqlFetch<{ setLoanApplicationStatus: StatusReply | null }>(
    LoanApplicationQueries.SET_LOAN_APPLICATION_STATUS_MUTATION,
    { id, status, ...(status === 'declined' ? { reason: reason?.trim() ?? '' } : {}) },
  );
  const refused = firstError(result.errors, STATUS_FAILED);
  if (refused) throw new Error(refused);
  if (!result.data?.setLoanApplicationStatus) throw new Error(STATUS_FAILED);
  return result.data.setLoanApplicationStatus;
}

/** Spaces pass the form's `required`, and the server reads them as null: stop them here. */
const hasBlankBasics = (input: LoanApplicationUpdateInput): boolean =>
  [input.info.firstname, input.info.lastname, input.detail.contact_no].some((value) => String(value ?? '').trim() === '');

/**
 * Loading the application: the record, or the reason there is none. While neither is there,
 * the page is loading, so there is no flag for it. An answer that arrives after the page has
 * moved on (another id, a retry, unmounted) is dropped.
 */
const useApplicationRecord = (id: number | null) => {
  const [record, setRecord] = useState<LoanApplicationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const reload = useCallback(async () => {
    const request = ++latest.current;
    if (id === null) {
      setRecord(null);
      setError(NOT_FOUND_MESSAGE);
      return;
    }
    setError(null);
    // Another application's record must not stay on screen under this one's actions.
    setRecord((current) => (current && String(current.id) === String(id) ? current : null));
    try {
      const found = await fetchApplication(id);
      if (request === latest.current) setRecord(found);
    } catch (failure) {
      if (request !== latest.current) return;
      const message = errorText(failure, LOAD_FAILED);
      console.error('[useLoanApplication] the application did not load', { id, message });
      setRecord(null);
      setError(message);
    }
  }, [id]);

  useEffect(() => {
    reload();
    return () => {
      latest.current += 1;
    };
  }, [reload]);

  return { record, setRecord, error, reload };
};

/** Saving an edit. The record becomes the one the server returns; BorrowerDetails keeps the form open. */
const useSaveApplication = (id: number | null, setRecord: SetRecord) => {
  const [saving, setSaving] = useState(false);
  // How many saves have gone through: the page checks the applicant again after each, as the name or the mobile number may have been corrected.
  const [saves, setSaves] = useState(0);

  const save = useCallback(
    async (input: LoanApplicationUpdateInput): Promise<ActionResult> => {
      const fail = (message: string): ActionResult => {
        toast.error(message);
        return { success: false, message };
      };
      if (id === null) return fail(SAVE_FAILED);
      if (hasBlankBasics(input)) return fail(BLANK_BASICS);
      setSaving(true);
      try {
        const saved = await postUpdate(id, input);
        // A save never changes the status or the borrower, and this reply may be older than a status
        // reply that arrived while the save was out: it must not bring the old status back.
        setRecord((current) => (current ? { ...saved, status: current.status, borrower_id: current.borrower_id } : saved));
        setSaves((count) => count + 1);
        toast.success(SAVED_MESSAGE);
        return { success: true };
      } catch (failure) {
        const message = errorText(failure, SAVE_FAILED);
        console.warn('[useLoanApplication] the save did not go through', { id, message });
        return fail(message);
      } finally {
        setSaving(false);
      }
    },
    [id, setRecord],
  );

  return { saving, save, saves };
};

/** The status reply merged into the record on screen. A field the reply lacks keeps what was there. */
const mergeStatusReply = (current: LoanApplicationRecord, reply: StatusReply): LoanApplicationRecord => ({
  ...current,
  status: reply.status,
  borrower_id: reply.borrower_id ?? current.borrower_id,
  outcome: reply.outcome ?? current.outcome,
  outcome_label: reply.outcome_label ?? current.outcome_label,
  decline_reason: reply.decline_reason === undefined ? current.decline_reason : reply.decline_reason,
  notes: reply.notes ?? current.notes,
});

/**
 * Changing the status. The reply is the status, the borrower id, the outcome and the notes, so it
 * is merged into the record on screen (not the whole record: the form may hold unsaved edits).
 * Each call posts: the select (StatusPicker) decides which choices are sent, and never has two
 * out at once. A decline carries its reason (useStatusDraft asks for it). Logs never carry it.
 */
const useApplicationStatus = (id: number | null, setRecord: SetRecord) => {
  const setStatus = useCallback(
    async (status: PickableStatus, reason?: string): Promise<ActionResult> => {
      if (id === null) return { success: false, message: STATUS_FAILED };
      try {
        const reply = await postStatus(id, status, reason);
        setRecord((current) => current && mergeStatusReply(current, reply));
        return { success: true };
      } catch (failure) {
        const message = errorText(failure, STATUS_FAILED);
        console.warn('[useLoanApplication] the status did not change', { id, status, message });
        toast.error(message);
        return { success: false, message };
      }
    },
    [id, setRecord],
  );

  return { setStatus };
};

/**
 * Printing: useDownloadPdf opens the window in the click that calls this (so popup
 * blockers allow it), shows its loader there, and sends it to the PDF. Call it straight
 * from the click handler, before any await.
 */
const usePrintApplication = (id: number | null) => {
  const { download, printing } = useDownloadPdf();

  const print = (): Promise<void> =>
    id === null
      ? Promise.resolve()
      : download({
          query: LoanApplicationQueries.PRINT_LOAN_APPLICATION_MUTATION,
          variables: { application_id: id },
          extractUrl: (data) => data?.printLoanApplication,
          loadingTitle: 'Generating application…',
          successMessage: 'Application ready.',
          errorMessage: 'Could not print the application. Please try again.',
        });

  return { printing, print };
};

/**
 * One application's page (/applications/[id]): the record, saving an edit, changing the
 * status and printing. `id` is the route's string; the schema's Int is sent. Logs carry
 * the id only: the input and the record hold names and mobile numbers.
 */
const useLoanApplication = (id: string) => {
  const applicationId = parseApplicationId(id);
  const { record, setRecord, error, reload } = useApplicationRecord(applicationId);
  const { saving, save, saves } = useSaveApplication(applicationId, setRecord);
  const { setStatus } = useApplicationStatus(applicationId, setRecord);
  const { printing, print } = usePrintApplication(applicationId);

  return {
    record,
    error,
    notFound: isNotFoundMessage(error),
    reload,
    saving,
    save,
    saves,
    setStatus,
    printing,
    print,
  };
};

export default useLoanApplication;
