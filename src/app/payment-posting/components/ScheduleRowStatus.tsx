import React from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import type { DataRowLoanSchedules } from '@/utils/DataTypes';
import { longDay, peso, type ScheduleRowState, type ScheduleRowView } from '@/utils/scheduleRowState';

/**
 * The Payment Posting schedule's states, drawn the app's way (StatusBadge: word + icon + colour,
 * never colour alone) and CHR's way for rows that need a person: a tint and a 4px left bar. Paid
 * rows stay quiet; overdue (red) and next due (gold) are the rows to act on. Research: PatternFly
 * "status and severity", RunSensible / timvero loan schedules (paid, partly paid, overdue, pending).
 */
export const ROW_MARKER: Record<ScheduleRowState, string> = {
  paid: '',
  upcoming: '',
  overdue: 'bg-danger/5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-danger',
  next: 'bg-secondary/10 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-secondary',
};

/** The badge and one line of detail under a row's due date. */
export const ScheduleRowStatus: React.FC<{ view: ScheduleRowView }> = ({ view }) => {
  const partly = view.state !== 'paid' && view.paidCents > 0;
  const detail =
    view.state === 'paid'
      ? `${peso(view.paidCents)} paid${view.paidOn ? ` · ${longDay(view.paidOn)}` : ''}`
      : partly
        ? `${peso(view.paidCents)} of ${peso(view.paidCents + view.dueCents)} paid`
        : null;

  return (
    <div className="flex flex-col items-start gap-0.5">
      {view.state === 'paid' && <StatusBadge tone="success">Paid</StatusBadge>}
      {view.state === 'overdue' && <StatusBadge tone="danger">{partly ? 'Overdue · partly paid' : 'Overdue'}</StatusBadge>}
      {view.state === 'next' && <StatusBadge tone="pending">{partly ? 'Next due · partly paid' : 'Next due'}</StatusBadge>}
      {view.state === 'upcoming' && partly && <StatusBadge tone="pending">Partly paid</StatusBadge>}
      {detail && <span className="text-xs tabular-nums text-body dark:text-bodydark">{detail}</span>}
    </div>
  );
};

/** Above the rows: how far along the loan is, what was collected, and the next date to post. */
export const ScheduleSummary: React.FC<{ views: ScheduleRowView[]; rows: DataRowLoanSchedules[] | undefined }> = ({ views, rows }) => {
  const total = views.length;
  if (total === 0) return null;
  const paidCount = views.filter((v) => v.state === 'paid').length;
  const overdue = views.filter((v) => v.state === 'overdue').length;
  const collected = views.reduce((sum, v) => sum + v.paidCents, 0);
  const nextIndex = views.findIndex((v) => v.state === 'overdue' || v.state === 'next');
  const nextDue = nextIndex >= 0 ? String(rows?.[nextIndex]?.due_date ?? '').slice(0, 10) : '';
  const pct = Math.round((paidCount / total) * 100);

  return (
    <div className="border-t border-stroke px-2 py-3 sm:px-4 md:px-6 dark:border-strokedark">
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-body dark:text-bodydark">
        <span className="font-semibold tabular-nums text-black dark:text-white">{paidCount} of {total} paid</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">{peso(collected)} collected</span>
        {nextDue && (
          <>
            <span aria-hidden="true">·</span>
            <span>{overdue > 0 ? 'Oldest unpaid' : 'Next due'} <span className="tabular-nums">{longDay(nextDue)}</span></span>
          </>
        )}
        {overdue > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-danger">{overdue} overdue</span>
          </>
        )}
        {paidCount === total && <><span aria-hidden="true">·</span><span className="font-semibold text-primary dark:text-olive-300">Fully paid</span></>}
      </p>
      <div
        role="progressbar"
        aria-label="Instalments paid"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={paidCount}
        aria-valuetext={`${paidCount} of ${total} paid`}
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stroke dark:bg-strokedark"
      >
        <div className="h-full rounded-full bg-primary dark:bg-olive-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
