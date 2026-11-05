"use client";

import React, { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { ArrowRight, Copy, Trash2 } from "react-feather";
import { useDeleteWithApproval } from "@/hooks/useDeleteWithApproval";
import useDeletionRequests from "@/hooks/useDeletionRequests";
import { usePendingDeletions, type PendingDeletionInfo } from "@/hooks/usePendingDeletions";
import { BORROWER_DELETE, showPendingBorrowerDeletion } from "@/hooks/borrowerDelete";
import type { BorrowerBranchRecord, BorrowerRowInfo } from "@/utils/DataTypes";
import { COPY_ACCENT_TEXT, LINK_FOCUS, SECTION_LABEL } from "./styles";

type PersonName = Pick<BorrowerRowInfo, "firstname" | "middlename" | "lastname">;
type OpenRecord = BorrowerBranchRecord & { id: number };

/** A record's own action: 48px on a phone, 40px with a mouse; quiet, the words carry it. */
const ACTION = `${LINK_FOCUS} focus-visible:outline-offset-2 inline-flex min-h-[48px] items-center gap-1.5 rounded px-2 text-sm font-medium lg:min-h-[40px]`;

/** "Original" for the root record, "Copy" for a branch copy: the word staff see on the Move screen. */
const RecordKind: React.FC<{ original: boolean }> = ({ original }) => (
  <span
    className={`rounded-sm px-1.5 py-px text-[11px] font-semibold uppercase tracking-[0.08em] ${
      original ? "bg-primary/10 text-primary dark:bg-white/10 dark:text-white" : `bg-accent/20 ${COPY_ACCENT_TEXT}`
    }`}
  >
    {original ? "Original" : "Copy"}
  </span>
);

/**
 * Remove one branch copy: the Borrowers list's Delete borrower flow (BORROWER_DELETE, so the Owner
 * deletes at once and everyone else files a request; a copy with active loans is refused by the
 * server), with a prompt that names the one branch it touches. Only ever on a copy, never the original.
 */
const RemoveCopy: React.FC<{
  record: OpenRecord;
  person: PersonName;
  pending: PendingDeletionInfo | undefined;
  others: string;
  refreshPending: () => Promise<void> | void;
  onRemoved: () => void;
}> = ({ record, person, pending, others, refreshPending, onRemoved }) => {
  const router = useRouter();
  const { cancel } = useDeletionRequests();
  const submit = useDeleteWithApproval({
    ...BORROWER_DELETE,
    promptTitle: `Remove the ${record.branch_name} copy?`,
    promptText: `This deletes only the ${record.branch_name} record. ${others} stays, with its loans, and the person's Approve / Reject decision does not change. If you are the Owner it happens now; otherwise an approver reviews it first.`,
    errorLabel: "Could not remove the copy",
  });

  const start = () => {
    if (pending) {
      void showPendingBorrowerDeletion(pending, person, { onView: () => router.push("/approvals"), cancel, refresh: refreshPending });
      return;
    }
    void submit({ id: record.id }, { onAfterRequest: refreshPending, onImmediateSuccess: onRemoved });
  };

  return (
    <button type="button" onClick={start} data-testid="branch-record-remove" className={`${ACTION} text-danger hover:bg-danger/10`}>
      <Trash2 aria-hidden="true" size={14} className="shrink-0" />
      {pending ? "Removal requested" : record.is_this ? "Remove this copy" : "Remove copy"}
    </button>
  );
};

/**
 * One record: its branch, Original or Copy, where you are, and what you can do with it: Open (another
 * record you may work) and Remove copy (a copy you may work). A record at a branch you can not work
 * says so and offers nothing.
 */
const RecordRow: React.FC<{ record: BorrowerBranchRecord; numbered: boolean; remove: React.ReactNode }> = ({ record, numbered, remove }) => (
  <li
    aria-current={record.is_this ? "page" : undefined}
    className={`flex min-h-[48px] flex-wrap items-center gap-x-2 border-l-[3px] pl-3 lg:min-h-[40px] ${record.is_this ? "border-l-primary" : "border-l-transparent"}`}
  >
    <span className="min-w-0 break-words font-semibold text-black dark:text-white">
      {record.branch_name}
      {numbered && record.id !== null && <span className="font-normal tabular-nums text-body dark:text-bodydark"> · #{record.id}</span>}
    </span>
    <RecordKind original={record.is_original} />
    {record.is_this && <span className="text-xs text-body dark:text-bodydark">you are here</span>}
    {!record.can_open && <span className="text-xs text-body dark:text-bodydark">not your branch</span>}
    <span className="ml-auto flex flex-wrap items-center">
      {!record.is_this && record.can_open && record.id !== null && (
        <Link href={`/borrowers/${record.id}`} prefetch={false} data-testid="branch-record-link" className={`${ACTION} group text-primary hover:underline dark:text-olive-300`}>
          Open
          <ArrowRight aria-hidden="true" size={14} className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
        </Link>
      )}
      {remove}
    </span>
  </li>
);

/** "Same person at 2 branches", or "Same person: 3 records at 2 branches" when two share a branch. */
const heading = (records: number, branches: number): string =>
  records === branches ? `Same person at ${branches} branches` : `Same person: ${records} records at ${branches} branch${branches === 1 ? "" : "es"}`;

/**
 * The person's branch records, with their own actions (Rafael 2026-11-04: Approve / Reject "feels like
 * it would reject both the Call Center and the move to a new branch"). Two groups, each saying what it
 * acts on: the decision group is about the borrower; this box is about the records -- Open one, or
 * Remove a copy. Nothing when the person has one record. Pattern: a linked-records marker labelled
 * original or copy (Helix's linked patient records), kept in the page, not a banner (GOV.UK).
 */
const BranchRecords: React.FC<{ records: BorrowerBranchRecord[] | null | undefined; person: PersonName }> = ({ records: loaded, person }) => {
  const titleId = useId();
  const router = useRouter();
  // Records an Owner just removed: dropped here, not by reloading, so unsaved Details edits survive.
  const [gone, setGone] = useState<number[]>([]);
  const records = useMemo(() => loaded?.filter((r) => r.id === null || !gone.includes(r.id)), [loaded, gone]);
  const removable = useMemo(
    () => (records ?? []).filter((r): r is OpenRecord => !r.is_original && r.can_open && r.id !== null),
    [records],
  );
  const ids = useMemo(() => removable.map((r) => r.id), [removable]);
  const { pendingByEntityId, refresh } = usePendingDeletions("borrower", ids);
  if (!records || records.length < 2) return null;

  const perBranch = new Map<string, number>();
  records.forEach((r) => perBranch.set(r.branch_name, (perBranch.get(r.branch_name) ?? 0) + 1));
  const originalGone = !records.some((r) => r.is_original);
  const original = records.find((r) => r.is_original);

  // After an Owner's immediate removal: this page's record is gone, so go to the original (or the
  // list); another record gone, so drop it from the list.
  const removed = (record: BorrowerBranchRecord) => () => {
    if (!record.is_this) return setGone((ids) => (record.id === null ? ids : [...ids, record.id]));
    router.push(original?.can_open && original.id !== null ? `/borrowers/${original.id}` : "/borrowers");
  };
  const othersOf = (record: BorrowerBranchRecord) => {
    const rest = Array.from(new Set(records.filter((r) => r !== record).map((r) => r.branch_name)));
    return rest.length === 1 ? `The ${rest[0]} record` : `The records at ${rest.join(", ")}`;
  };

  return (
    <section
      aria-labelledby={titleId}
      data-testid="branch-records"
      className="mt-3 max-w-3xl rounded-lg border border-stroke bg-white px-4 py-3 shadow-sm dark:border-strokedark dark:bg-boxdark"
    >
      <h3 id={titleId} className={`flex items-center gap-2 ${SECTION_LABEL}`}>
        <Copy aria-hidden="true" size={13} className={`shrink-0 ${COPY_ACCENT_TEXT}`} />
        {heading(records.length, perBranch.size)}
      </h3>
      <ul className="mt-1 flex flex-col divide-y divide-stroke dark:divide-strokedark">
        {records.map((record, index) => {
          const mine = record.id === null ? undefined : removable.find((r) => r.id === record.id);
          return (
            <RecordRow
              key={record.id ?? `hidden-${index}`}
              record={record}
              numbered={(perBranch.get(record.branch_name) ?? 0) > 1}
              remove={
                mine ? (
                  <RemoveCopy
                    record={mine}
                    person={person}
                    pending={pendingByEntityId.get(mine.id)}
                    others={othersOf(record)}
                    refreshPending={refresh}
                    onRemoved={removed(record)}
                  />
                ) : null
              }
            />
          );
        })}
      </ul>
      <p data-testid="branch-records-note" className="mt-1.5 text-xs text-body dark:text-bodydark">
        {originalGone ? "The original record was deleted; these copies remain. " : ""}
        Approve borrower and Reject borrower don&rsquo;t add or remove these records.
      </p>
    </section>
  );
};

export default BranchRecords;
