"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { APPLICATION_STATUS_LABEL } from '@/app/applications/components/ApplicationStatusPill';
import type { ActionResult, PickableStatus } from '@/hooks/useLoanApplication';
import type { LoanApplicationStatus } from '@/utils/DataTypes';

/** How long the button says "Saved" before it goes quiet again. */
export const SAVED_SHOWN_MS = 3000;

/** The status as staff are changing it: a choice in the select that nothing has saved yet. */
export interface StatusDraft {
  /** What the select shows: the choice, or the saved status when none has been made. */
  shown: LoanApplicationStatus;
  /** The choice differs from the saved status: there is something to save, and Create as borrower must wait for it. */
  pending: boolean;
  /** The one post is out. */
  saving: boolean;
  /** The status was just saved: the button says "Saved", for SAVED_SHOWN_MS. */
  justSaved: boolean;
  /** For the polite live region: "Status saved: Interviewed" after a save, otherwise empty. */
  announcement: string;
  /** For the alert region and its visible copy: the reason the server gave when it refused, otherwise empty. */
  error: string;
  /** Changes the choice. Posts nothing: only `save` does. */
  choose: (next: PickableStatus) => void;
  /** Posts the choice, once. Does nothing while one is out, or when the choice is the saved status. */
  save: () => Promise<void>;
}

/** A flag that is on for a moment and then goes off by itself; `clear` puts it off at once. */
function useFlash(ms: number): { on: boolean; flash: () => void; clear: () => void } {
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const clear = useCallback(() => {
    clearTimeout(timer.current);
    setOn(false);
  }, []);
  const flash = useCallback(() => {
    clearTimeout(timer.current);
    setOn(true);
    timer.current = setTimeout(() => setOn(false), ms);
  }, [ms]);
  return { on, flash, clear };
}

/**
 * The status select is a draft, saved by a button of its own. Choosing only changes `shown`
 * (a keyboard that steps through the options with every arrow press changes nothing on the
 * server); `save` posts the choice, exactly once, and a second press while it is out is
 * ignored (the ref answers at once, before a render could). On success the page's record
 * follows the server (the pill, Create as borrower) and the choice is cleared, so the select
 * shows the saved status again; on a refusal the choice stays, so staff can try again or
 * change it back. Leaving the page with an unsaved choice posts nothing.
 */
export function useStatusDraft(
  saved: LoanApplicationStatus,
  post: (next: PickableStatus) => Promise<ActionResult>,
): StatusDraft {
  const [choice, setChoice] = useState<PickableStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [error, setError] = useState('');
  const { on: justSaved, flash: flashSaved, clear: clearSaved } = useFlash(SAVED_SHOWN_MS);
  const sending = useRef(false);

  const choose = useCallback(
    (next: PickableStatus): void => {
      clearSaved();
      setError('');
      setChoice(next);
    },
    [clearSaved],
  );

  const save = useCallback(async (): Promise<void> => {
    if (sending.current || choice === null || choice === saved) return;
    sending.current = true;
    setSaving(true);
    setError('');
    clearSaved();
    try {
      const result = await post(choice);
      setAnnouncement(result.success ? `Status saved: ${APPLICATION_STATUS_LABEL[choice]}` : '');
      if (result.success) {
        setChoice(null);
        flashSaved();
      } else {
        setError(result.message);
      }
    } finally {
      sending.current = false;
      setSaving(false);
    }
  }, [choice, saved, post, clearSaved, flashSaved]);

  return {
    shown: choice ?? saved,
    pending: choice !== null && choice !== saved,
    saving,
    justSaved,
    announcement,
    error,
    choose,
    save,
  };
}
