"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { Clock, RotateCw, Trash2 } from 'react-feather';
import { useStore } from 'zustand';
import { showProcessingModal } from '@/components/ConfirmationModal';
import { APPLICATION_DELETE } from '@/hooks/applicationDelete';
import { useDeleteWithApproval } from '@/hooks/useDeleteWithApproval';
import useDeletionRequests from '@/hooks/useDeletionRequests';
import { usePendingDeletions, type PendingDeletionInfo } from '@/hooks/usePendingDeletions';
import { useAuthStore } from '@/store/authStore';

/** The 48px phone target the rest of the page's actions use, 40px from md up. */
const BUTTON =
  'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded px-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark sm:w-auto md:min-h-10';

/**
 * The application's deletion: whether a request waits on it, and the two things a user can do about
 * it. Delete goes through useDeleteWithApproval with APPLICATION_DELETE, the flow every other delete
 * uses: the Owner's goes at once (back to the list, the application is gone); anyone else's becomes a
 * request, and the pending line appears. Withdraw takes back the user's own request.
 */
export const useApplicationDeletion = (applicationId: number) => {
  const router = useRouter();
  // Call Center may file a deletion but reads nothing of the queue (CallCenterAllowList): it is not asked.
  const isCallCenter = useStore(useAuthStore, (state) => state.user?.role?.code === 'CALLCTR');
  const ids = useMemo(() => (isCallCenter ? [] : [applicationId]), [applicationId, isCallCenter]);
  const { pendingByEntityId, refresh } = usePendingDeletions('loan_application', ids);
  const { cancel } = useDeletionRequests();
  const submitDelete = useDeleteWithApproval(APPLICATION_DELETE);

  const startDelete = () =>
    submitDelete({ id: applicationId }, { onAfterRequest: refresh, onImmediateSuccess: () => router.replace('/applications') });

  const withdraw = async (requestId: string): Promise<void> => {
    const closeProcessing = showProcessingModal('Withdrawing the request…');
    try {
      if (await cancel(requestId)) await refresh();
    } finally {
      closeProcessing();
    }
  };

  return { pending: pendingByEntityId.get(applicationId), startDelete, withdraw };
};

/** "Oct 28, 2026, 9:05 AM", in Manila, from the server's created_at. */
const when = (value: string): string => {
  const date = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}+08:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

/**
 * A request to delete the application is waiting: who asked, when and why, on a gold rule (the
 * colour /approvals gives a waiting request). It sits right under the actions, because while it
 * waits the branch, Create as borrower and Link are refused, and this says why before anyone tries.
 * The requester may withdraw it; anyone else may go and decide it on /approvals. Never shown to Call
 * Center, which reads nothing of the queue (useApplicationDeletion does not ask for it).
 */
export const PendingDeletionNotice: React.FC<{
  pending: PendingDeletionInfo;
  onWithdraw: (requestId: string) => Promise<void>;
}> = ({ pending, onWithdraw }) => {
  const [busy, setBusy] = useState(false);
  const who = pending.is_mine ? 'You' : pending.requested_by_name || 'Someone';

  const withdraw = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onWithdraw(String(pending.request_id));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-label="Deletion request"
      data-testid="pending-deletion"
      className="relative overflow-hidden rounded-2xl border border-accent/50 bg-accent/10 px-4 py-4 pl-6 dark:border-accent/40 dark:bg-accent/10 sm:px-6 sm:pl-8"
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-accent" />
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A6312] dark:text-accent">
            <Clock aria-hidden="true" size={14} className="shrink-0" />
            Waiting for approval
          </p>
          <p className="mt-1.5 font-display text-lg font-semibold leading-snug text-black dark:text-white">
            {who} asked to delete this application.
          </p>
          <p className="mt-1 text-sm text-body dark:text-bodydark">
            {when(pending.created_at)}. Until an approver decides, the branch cannot be changed and no borrower can be made from it.
          </p>
          {pending.reason && (
            <p className="mt-2 break-words border-l-2 border-accent/60 pl-3 text-sm italic text-black dark:text-white">
              <span className="sr-only">Reason: </span>
              {pending.reason}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
          {pending.is_mine && (
            <button
              type="button"
              aria-disabled={busy}
              onClick={withdraw}
              className={`${BUTTON} border border-stroke bg-white text-black hover:border-primary/50 focus-visible:ring-primary dark:border-strokedark dark:bg-boxdark dark:text-white ${busy ? 'cursor-progress' : ''}`}
            >
              {busy && <RotateCw aria-hidden="true" size={16} className="shrink-0 motion-safe:animate-spin" />}
              Withdraw request
            </button>
          )}
          <Link href="/approvals" prefetch={false} className={`${BUTTON} text-primary underline-offset-4 hover:underline focus-visible:ring-primary dark:text-bodydark`}>
            Open Approvals
          </Link>
        </div>
      </div>
    </section>
  );
};

/**
 * Delete, at the foot of the record, apart from the everyday actions above (a destructive action is
 * kept a deliberate scroll away from Edit and Print). It says what happens before the prompt asks
 * why: the Owner's delete is immediate, anyone else's waits for an approver. Not rendered while a
 * request waits (the notice above takes its place) or when the user may not change the application.
 */
export const DeleteApplicationSection: React.FC<{ onDelete: () => void }> = ({ onDelete }) => {
  const isOwner = useStore(useAuthStore, (state) => state.user?.role?.code === 'OWN');
  return (
    <section
      aria-labelledby="delete-application-heading"
      className="flex flex-col gap-4 rounded-2xl border border-dashed border-danger/40 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between"
    >
      <div className="min-w-0">
        <h3 id="delete-application-heading" className="font-display text-base font-semibold text-black dark:text-white">
          Delete this application
        </h3>
        <p className="mt-1 text-sm text-body dark:text-bodydark">
          {isOwner
            ? 'It is removed from Applications and its counts right away. You will be asked for the reason.'
            : 'An approver reviews it first. You will be asked for the reason, and the approver sees it.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className={`${BUTTON} shrink-0 border border-danger text-danger hover:bg-danger hover:text-white focus-visible:ring-danger`}
      >
        <Trash2 aria-hidden="true" size={16} className="shrink-0" />
        Delete application
      </button>
    </section>
  );
};
