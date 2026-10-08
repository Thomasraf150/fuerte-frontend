"use client";

import React, { useId } from 'react';
import { Check, X } from 'react-feather';
import { Card, CardHeader } from '@/components/Card';
import { formatDecidedOn } from '@/components/DecisionPill';
import type { ApplicationNote } from '@/utils/DataTypes';

const ACTION: Record<ApplicationNote['kind'], string> = {
  declined: 'Declined',
  borrower_rejected: 'Borrower rejected',
  borrower_approved: 'Borrower approved',
};

/** "Declined by Call Center": the action and the actor's ROLE, never a person's name. */
export const noteAction = (note: ApplicationNote): string => {
  const role = note.role_label?.trim();
  return `${ACTION[note.kind] ?? note.kind}${role ? ` by ${role}` : ''}`;
};

/** Newest first. The server's 'Y-m-d H:i:s' sorts as text. */
const newestFirst = (notes: readonly ApplicationNote[]): ApplicationNote[] =>
  [...notes].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

/**
 * One note. A no is marked with an X on danger, a yes with a check on success: the word is always
 * there, so colour is never the only signal. The reason, when there is one, is the staff's own
 * words, set off by a rule in the same colour.
 */
const NoteItem: React.FC<{ note: ApplicationNote }> = ({ note }) => {
  const approved = note.kind === 'borrower_approved';
  const NoteIcon = approved ? Check : X;
  const reason = note.reason?.trim();
  const date = formatDecidedOn(note.at);
  return (
    <li data-note={note.kind} className="flex gap-3 px-4 py-3.5">
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          approved ? 'bg-success/10 text-success dark:text-meta-3' : 'bg-danger text-white'
        }`}
      >
        <NoteIcon size={13} strokeWidth={3} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-black dark:text-white">
          <span className="font-semibold">{noteAction(note)}</span>
          {date && (
            <span className="text-body dark:text-bodydark">
              <span aria-hidden="true"> · </span>
              {date}
            </span>
          )}
        </p>
        {reason && (
          <p
            className={`mt-1.5 whitespace-pre-line break-words border-l-2 pl-3 text-sm text-black dark:text-bodydark ${
              approved ? 'border-success/60' : 'border-danger/70'
            }`}
          >
            <span className="sr-only">Reason: </span>
            {reason}
          </p>
        )}
      </div>
    </li>
  );
};

/**
 * Notes (/applications/[id]): why the application was declined, and the borrower's latest Approved
 * or Rejected with its reason, newest first. Read-only; the status picker and the borrower page
 * are where they are written. Nothing when there are none.
 */
export const NotesPanel: React.FC<{ notes: readonly ApplicationNote[] | null | undefined }> = ({ notes }) => {
  const titleId = useId();
  if (!notes?.length) return null;
  return (
    <Card aria-labelledby={titleId} className="overflow-hidden">
      <CardHeader id={titleId} title="Notes" />
      <ol className="divide-y divide-stroke dark:divide-strokedark">
        {newestFirst(notes).map((note) => (
          <NoteItem key={`${note.kind}-${note.at}`} note={note} />
        ))}
      </ol>
    </Card>
  );
};
