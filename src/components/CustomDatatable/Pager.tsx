"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'react-feather';
import { formatCount } from '@/utils/helper';
import type { ServerSidePaginationProps } from './index';
import { pageWindow } from './pageWindow';

/**
 * The server-side pager every list shares (spec 2026-10-05, shared table v2 item 1).
 *
 * - First, Previous, a page window (page 1, the last page, the current page and its
 *   neighbours, ellipses between), Next and Last. Below `sm` the numbered window gives way to
 *   "4 of 32" between the four arrows, so the pager is one row on a 360px phone.
 * - Every control is 48px below `lg` (a budget Android thumb) and 40px from `lg`.
 * - "1–20 of 630 borrowers"; with no rows "No borrowers", never "Showing 1 to 0 of 0".
 *   The noun comes from recordType / recordTypePlural, defaulting to "record(s)".
 */
const TARGET = 'inline-flex min-h-12 min-w-12 items-center justify-center rounded border text-sm tabular-nums transition-colors lg:min-h-10 lg:min-w-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const IDLE = 'border-stroke bg-white text-black hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40 dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:border-primary';
const CURRENT = 'border-primary bg-primary font-semibold text-white';

interface NavProps {
  current: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
}

/** First, Previous, the page window (from `sm`; "N of M" below it), Next and Last. */
const PageNav: React.FC<NavProps> = ({ current, total, hasPrevious, hasNext, onPageChange }) => {
  const go = (page: number) => () => onPageChange(page);
  return (
    <nav aria-label="Pages" className="flex w-full flex-wrap items-center justify-between gap-1 sm:w-auto sm:justify-start sm:gap-1.5">
      <button type="button" className={`${TARGET} ${IDLE}`} onClick={go(1)} disabled={!hasPrevious} aria-label="First page"><ChevronsLeft size={18} aria-hidden="true" /></button>
      <button type="button" className={`${TARGET} ${IDLE}`} onClick={go(current - 1)} disabled={!hasPrevious} aria-label="Previous page"><ChevronLeft size={18} aria-hidden="true" /></button>
      {pageWindow(current, total).map((slot, i) => slot === 'gap'
        ? <span key={`gap-${i}`} className="hidden min-w-6 justify-center text-sm text-body sm:inline-flex dark:text-bodydark" aria-hidden="true">…</span>
        : (
          <button
            key={slot}
            type="button"
            className={`${TARGET} !hidden px-3 sm:!inline-flex ${slot === current ? CURRENT : IDLE}`}
            onClick={go(slot)}
            aria-label={`Page ${slot}`}
            aria-current={slot === current ? 'page' : undefined}
          >
            {formatCount(slot)}
          </button>
        ))}
      <span className="px-1 text-sm tabular-nums text-black sm:hidden dark:text-white" aria-current="page"><span className="sr-only">Page </span>{formatCount(current)} of {formatCount(total)}</span>
      <button type="button" className={`${TARGET} ${IDLE}`} onClick={go(current + 1)} disabled={!hasNext} aria-label="Next page"><ChevronRight size={18} aria-hidden="true" /></button>
      <button type="button" className={`${TARGET} ${IDLE}`} onClick={go(total)} disabled={!hasNext} aria-label="Last page"><ChevronsRight size={18} aria-hidden="true" /></button>
    </nav>
  );
};

const Pager: React.FC<{ pagination: ServerSidePaginationProps }> = ({ pagination }) => {
  const { totalRecords, currentPage, pageSize, totalPages, hasNextPage, hasPreviousPage, onPageChange, onPageSizeChange, pageSizeOptions = [10, 20, 50, 100] } = pagination;
  const singular = pagination.recordType || 'record';
  const plural = pagination.recordTypePlural || 'records';
  // "posted", "pending approval"... in front of the noun, as the old pager said it.
  const status = pagination.statusFilter && pagination.statusFilter !== 'all' ? `${pagination.statusFilter.replace('_', ' ')} ` : '';
  const first = (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, totalRecords);
  const summary = totalRecords > 0
    ? `${formatCount(first)}–${formatCount(last)} of ${formatCount(totalRecords)} ${status}${totalRecords === 1 ? singular : plural}`
    : `No ${status}${plural}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-stroke bg-white py-3 sm:px-4 dark:border-strokedark dark:bg-boxdark">
      <p className="text-sm text-body dark:text-bodydark" aria-live="polite">{summary}</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm text-body dark:text-bodydark">
          Rows
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-12 rounded border border-stroke bg-white px-3 text-sm text-black focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:h-10 dark:border-strokedark dark:bg-form-input dark:text-white"
          >
            {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        {totalPages > 1 && <PageNav current={currentPage} total={totalPages} hasPrevious={hasPreviousPage} hasNext={hasNextPage} onPageChange={onPageChange} />}
      </div>
    </div>
  );
};

export default Pager;
