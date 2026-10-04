"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'react-feather';

export const NOT_FOUND_TEXT = "This application doesn't exist or isn't yours to see.";

const BAR = 'rounded bg-stroke dark:bg-meta-4';
const CARD = 'rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark';

/**
 * What shows while the application loads: the shape the page will have (header, actions,
 * form), so nothing jumps when it arrives. The pulse stops for visitors who ask for less motion.
 */
export const ApplicationSkeleton: React.FC = () => (
  <div role="status" aria-busy="true" className="space-y-4 motion-safe:animate-pulse">
    <span className="sr-only">Loading the application…</span>
    <div className={`${CARD} px-5 py-5 sm:px-8`}>
      <div className={`${BAR} h-4 w-40`} />
      <div className={`${BAR} mt-4 h-7 w-3/5 max-w-sm`} />
      <div className={`${BAR} mt-4 h-4 w-2/3 max-w-xs`} />
    </div>
    <div className={`${CARD} flex flex-col gap-3 p-3 md:flex-row md:items-center md:px-5`}>
      <div className={`${BAR} h-12 md:h-10 md:w-28`} />
      <div className={`${BAR} h-12 md:h-10 md:w-56`} />
      <div className={`${BAR} h-12 md:ml-auto md:h-10 md:w-44`} />
    </div>
    <div className={`${CARD} space-y-4 p-5 sm:p-7`}>
      <div className={`${BAR} h-5 w-36`} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={`${BAR} h-12 md:h-10`} />
        <div className={`${BAR} h-12 md:h-10`} />
      </div>
      <div className={`${BAR} h-12 md:h-10`} />
    </div>
  </div>
);

/**
 * A missing application and one this user may not see look the same on purpose: the
 * server gives one answer for both, and so does this card.
 */
export const NotFoundCard: React.FC = () => (
  <div className={`${CARD} flex flex-col items-center px-6 py-12 text-center`}>
    <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-whiten text-body dark:bg-meta-4 dark:text-bodydark">
      <FileText size={22} />
    </span>
    <h3 className="mt-4 font-medium text-black dark:text-white">Application not found</h3>
    <p className="mt-1 max-w-sm text-sm text-body dark:text-bodydark">{NOT_FOUND_TEXT}</p>
    <Link
      href="/applications"
      className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark md:min-h-10"
    >
      <ArrowLeft aria-hidden="true" size={16} className="shrink-0" />
      Back to Applications
    </Link>
  </div>
);
