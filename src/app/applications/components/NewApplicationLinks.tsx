"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'react-feather';
import { applicationNumber } from '@/utils/convertApplication';
import type { NewApplicationRef } from '@/utils/DataTypes';

/** How many of the new applications get a link of their own; the rest are counted. */
export const MAX_NEW_LINKS = 5;

/**
 * The applications to link: the newest first (the server sends them in the order the input
 * had them, and the list shows the newest at the top), at most MAX_NEW_LINKS of them, and how
 * many more there were.
 */
export function linksToShow(added: readonly NewApplicationRef[]): { shown: NewApplicationRef[]; more: number } {
  const newestFirst = [...added].reverse();
  return { shown: newestFirst.slice(0, MAX_NEW_LINKS), more: Math.max(newestFirst.length - MAX_NEW_LINKS, 0) };
}

/**
 * A link row: 48px tall at every size (a thumb), outlined in the primary colour so that it reads
 * as the way on from the tally, and the same focus ring as the page's other links. The name wraps
 * rather than being cut: a long name must not widen a phone.
 */
const LINK =
  'flex min-h-12 w-full items-center justify-between gap-3 rounded border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-black transition-colors hover:border-primary hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:text-white dark:focus-visible:ring-offset-boxdark';

const Arrow: React.FC = () => <ArrowRight aria-hidden="true" size={16} className="shrink-0 text-primary dark:text-white" />;

/** The application's number and whose it is, the name in capitals (drawn so; the text is as the server sent it). */
const Who: React.FC<{ item: NewApplicationRef }> = ({ item }) => (
  <>
    <span className="font-semibold tabular-nums">{applicationNumber(item.id)}</span>{' '}
    <span className="uppercase">{item.full_name}</span>
  </>
);

/**
 * Under an upload's tally: a way into what it just added, so staff need not scroll the list for it.
 * One new application gets one clear link; two to MAX_NEW_LINKS get a short list, newest first;
 * more than that get the newest MAX_NEW_LINKS and a count of the rest (they are at the top of the
 * list). Nothing at all when nothing was added: "Already here" says what happened then.
 */
const NewApplicationLinks: React.FC<{ added: readonly NewApplicationRef[] }> = ({ added }) => {
  const { shown, more } = linksToShow(added);
  if (shown.length === 0) return null;

  if (added.length === 1) {
    return (
      <div className="border-t border-stroke px-4 py-3 dark:border-strokedark">
        <Link href={`/applications/${shown[0].id}`} prefetch={false} className={LINK}>
          <span className="min-w-0 break-words">
            Open the new application: <Who item={shown[0]} />
          </span>
          <Arrow />
        </Link>
      </div>
    );
  }

  return (
    <div className="border-t border-stroke px-4 py-3 dark:border-strokedark">
      <h5 className="text-sm font-semibold text-black dark:text-white">New applications</h5>
      <p className="mt-0.5 text-xs text-body dark:text-bodydark">Newest first.</p>
      <ul className="mt-2 space-y-2">
        {shown.map((item, index) => (
          <li key={`${item.id}-${index}`}>
            <Link href={`/applications/${item.id}`} prefetch={false} className={LINK}>
              <span className="min-w-0 break-words">
                <span className="sr-only">Open </span>
                <Who item={item} />
              </span>
              <Arrow />
            </Link>
          </li>
        ))}
      </ul>
      {more > 0 && <p className="mt-2 text-sm text-body dark:text-bodydark">and {more} more at the top of the list.</p>}
    </div>
  );
};

export default NewApplicationLinks;
