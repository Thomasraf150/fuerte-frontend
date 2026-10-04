"use client";

import React, { useEffect, useRef } from 'react';
import { useWatch, type Control } from 'react-hook-form';
import { toApplicationUpdateInput, type ApplicationFormValues } from '@/utils/applicationForm';
import type { LoanApplicationUpdateInput } from '@/utils/DataTypes';

/** The branch the picker holds, as the text its options hold: '' when none is picked. */
export const pickedBranch = (values: ApplicationFormValues): string => String(values.branch_sub_id ?? '');

/** The day the Date applied input holds, `Y-m-d`: '' when the field is not on the page or has been cleared. */
export const pickedDay = (values: ApplicationFormValues): string => String(values.submitted_on ?? '');

/** The two picks Save sends only when they were changed, as the form last had them saved. */
export interface SavedPicks {
  /** The branch, as the picker holds it. */
  branch: string;
  /** The day applied, `Y-m-d`. */
  day: string;
}

/** The picks as they stand in the form: what a save that goes through makes the saved ones. */
export const picksOf = (values: ApplicationFormValues): SavedPicks => ({ branch: pickedBranch(values), day: pickedDay(values) });

/**
 * The input Save posts for these values.
 *
 * The branch goes only when the user changed the picker in this form: when it is not the one
 * the page loaded or last saved (`saved.branch`). The server moves an application whenever the
 * branch sent differs from the stored one, so a page gone stale (a colleague moved the
 * application after it was opened) would undo that move by sending its old branch along with
 * an edit that has nothing to do with it. A user who may not assign a branch never sends one:
 * the form only shows theirs. The day applied goes by the same rule (`saved.day`): it is a
 * correction, and an edit to a phone number is not one.
 */
export const saveInputFor = (values: ApplicationFormValues, mayAssign: boolean, saved: SavedPicks): LoanApplicationUpdateInput => {
  const picks = picksOf(values);
  return toApplicationUpdateInput(
    values,
    mayAssign && picks.branch !== saved.branch ? picks.branch : null,
    picks.day !== saved.day ? picks.day : null,
  );
};

/**
 * What the form says, as one string: the input a Save would post, with the picker's branch and
 * the day applied in it whether or not Save would send them, plus how many reference rows the
 * form holds. Built by the same function Save uses, so "15,000.00" shown and "15000.00" stored
 * are one value, and nothing Save would not send can make the form look edited. The picker and
 * the date are part of what the form says: changing either is an unsaved change (and putting it
 * back is not), though an untouched one is not sent. A blank reference row posts nothing, but
 * adding or removing one is an edit the form has not saved.
 */
export const formSnapshot = (values: ApplicationFormValues, mayAssign: boolean): string =>
  JSON.stringify({
    input: toApplicationUpdateInput(values, mayAssign ? pickedBranch(values) : null, pickedDay(values)),
    referenceRows: Array.isArray(values.reference) ? values.reference.length : 0,
  });

interface WatcherProps {
  control: Control<any>;
  mayAssign: boolean;
  /** The form as it was last saved: as loaded until the first save. Null until the form has been read. */
  saved: string | null;
  onBaseline: (snapshot: string) => void;
  onDirty: (dirty: boolean) => void;
  /**
   * The form has changed since it was last read: an edit, whether or not the page saw a DOM
   * event for it. Given the form's new snapshot, so a save that is out can tell whether the
   * form has moved on from what it posted.
   */
  onEdit: (snapshot: string) => void;
}

/**
 * Draws nothing. It watches EVERY field of the form it is rendered in (BorrowerDetails'
 * renderExtraFields hands over `control`) and tells the page whether the form differs from what
 * is saved, and when it is edited. A listener on the form's inputs would miss what fires no DOM
 * event: a pick in a react-select (Branch, Chief, Area, Office), and a reference row added or
 * removed.
 */
export const UnsavedChangesWatcher: React.FC<WatcherProps> = ({ control, mayAssign, saved, onBaseline, onDirty, onEdit }) => {
  const current = formSnapshot(useWatch({ control }) as ApplicationFormValues, mayAssign);
  const previous = useRef(current);

  useEffect(() => {
    if (saved === null) onBaseline(current);
  }, [saved, current, onBaseline]);

  useEffect(() => {
    onDirty(saved !== null && current !== saved);
  }, [saved, current, onDirty]);

  useEffect(() => {
    if (previous.current === current) return;
    previous.current = current;
    onEdit(current);
  }, [current, onEdit]);

  // A form that goes away takes its changes with it.
  useEffect(() => () => onDirty(false), [onDirty]);

  return null;
};
