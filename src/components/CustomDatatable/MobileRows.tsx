"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'react-feather';
import DataTableLoadingComponent from './LoadingComponent';

interface Props<T> {
  rows: T[];
  render: (row: T) => React.ReactNode;
  /** The row's own buttons (Edit, Remove, View…), drawn BESIDE the row's link, never inside it. */
  actions?: (row: T) => React.ReactNode;
  rowHref?: (row: T) => string;
  onRowClicked?: (row: T, event: React.MouseEvent) => void;
  loading: boolean;
  plural: string;
}

const ROW = 'flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-whiten focus-visible:bg-whiten focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent dark:hover:bg-meta-4 dark:focus-visible:bg-meta-4';

/**
 * Stacked phone rows (shared table v2 item 7), below `md` in place of the table. Each row is
 * ONE tap target: a real link when the list has `rowHref` (so long-press and "open in new tab"
 * work), otherwise a button calling onRowClicked. At least 56px tall, with a chevron. Names
 * wrap at spaces: nothing here sets overflow-wrap:anywhere.
 *
 * `render` goes INSIDE that link or button, so it must return plain content: no link, button
 * or input of its own (nested interactive elements are invalid HTML and break hydration).
 * conditionalRowStyles do not apply here; a list that tints rows must render its own mark.
 *
 * `actions` (Phase 8, 2026-10-08) carries the buttons a desktop row has (Edit, Remove…) under the
 * row's content, as siblings of the link, so a phone keeps every action with the same words. With
 * actions and no rowHref / onRowClicked, the content is plain text and the buttons are the targets.
 */
function MobileRows<T extends object>({ rows, render, actions, rowHref, onRowClicked, loading, plural }: Props<T>): JSX.Element {
  if (loading && rows.length === 0) return <DataTableLoadingComponent columns={1} />;
  if (rows.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-body dark:text-bodydark">No {plural} to show.</p>;
  }

  return (
    <ul className="divide-y divide-stroke border-y border-stroke dark:divide-strokedark dark:border-strokedark" aria-busy={loading}>
      {rows.map((row, index) => {
        const key = String((row as { id?: unknown }).id ?? index);
        const opens = Boolean(rowHref || onRowClicked);
        const body = (
          <>
            <div className="min-w-0 flex-1">{render(row)}</div>
            {opens && <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-body dark:text-bodydark" />}
          </>
        );
        const rowActions = actions?.(row);
        return (
          <li key={key}>
            {rowHref
              ? <Link href={rowHref(row)} className={ROW}>{body}</Link>
              : opens
                ? <button type="button" className={ROW} onClick={(event) => onRowClicked?.(row, event)}>{body}</button>
                : <div className="flex min-h-14 w-full items-center gap-3 px-4 pt-3">{body}</div>}
            {rowActions && <div className="flex flex-wrap items-center gap-2 px-4 pb-3 pt-1">{rowActions}</div>}
          </li>
        );
      })}
    </ul>
  );
}

export default MobileRows;
