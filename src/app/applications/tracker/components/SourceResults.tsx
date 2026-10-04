"use client";

import React, { useEffect, useState } from 'react';
import { HelpCircle } from 'react-feather';
import { CHANNEL_ICONS, TINTS } from '@/app/applications/components/channelIcons';
import { CHANNEL_LABELS } from '@/utils/applicationForm';
import { formatCount } from '@/utils/helper';
import { applicationsNoun, shareLabel, shareOf, type SourceRow, type SourceSummary } from '@/utils/sourceTracker';

/** "Not recorded" is neutral on purpose: it is the gap in the tally, not a source. */
const NEUTRAL = 'text-bodydark2';

/**
 * False until the first frame after the results mount, so the bars start empty and
 * grow to their width. Under prefers-reduced-motion the transitions are off and they
 * simply appear.
 */
function useGrown(): boolean {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return grown;
}

/*
 * One strip across the top shows the whole tally at a glance: a segment per source,
 * as wide as its share, in the colour of its card's icon. A source with nothing has
 * no segment. The colour comes from the same TINTS the Saan galing tiles use: the
 * outer span carries it (the tint and `text-meta-*`) and the inner span paints
 * currentColor, so there is one place that says which source is which colour.
 * Decoration only: every number it shows is written out below it.
 */
const ProportionStrip: React.FC<{ summary: SourceSummary; grown: boolean }> = ({ summary, grown }) => {
  const segments = [
    ...summary.rows.filter((row) => row.count > 0).map((row) => ({ key: row.channel, count: row.count, tone: TINTS[row.channel] })),
    ...(summary.notRecorded > 0 ? [{ key: 'unknown', count: summary.notRecorded, tone: NEUTRAL }] : []),
  ];
  return (
    <div aria-hidden="true" className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-stroke dark:bg-strokedark">
      {segments.map(({ key, count, tone }) => (
        <span
          key={key}
          className={`min-w-1 transition-[flex-grow] duration-700 ease-out motion-reduce:transition-none ${tone}`}
          style={{ flexGrow: grown ? count : 0, flexBasis: 0 }}
        >
          <span className="block h-full bg-current" />
        </span>
      ))}
    </div>
  );
};

/** The total, and the strip. "No applications in this period." when there is nothing to count. */
const TotalBlock: React.FC<{ summary: SourceSummary; grown: boolean }> = ({ summary, grown }) => (
  <div className="rounded-sm bg-whiter p-4 dark:bg-boxdark-2 sm:p-5">
    <p className="text-xs font-semibold uppercase tracking-wider text-body dark:text-bodydark">Total</p>
    <p className="mt-1 text-title-xl font-bold tabular-nums text-black dark:text-white md:text-title-xxl">
      {formatCount(summary.total)}
      <span className="sr-only"> {applicationsNoun(summary.total)}</span>
    </p>
    <div className="mt-3">
      <ProportionStrip summary={summary} grown={grown} />
    </div>
    {summary.total === 0 && (
      <p className="mt-3 text-sm text-body dark:text-bodydark">No applications in this period.</p>
    )}
  </div>
);

/** The card's own bar: its share of the total, tinted track and solid fill in the source's colour. */
const ShareBar: React.FC<{ row: SourceRow; total: number; grown: boolean }> = ({ row, total, grown }) => {
  const share = shareOf(row.count, total);
  // A source with any applications always shows a sliver, so it never looks empty.
  const width = share > 0 ? Math.max(share * 100, 2) : 0;
  return (
    <span aria-hidden="true" className={`block h-1.5 min-w-0 flex-1 overflow-hidden rounded-full ${TINTS[row.channel]}`}>
      <span
        className="block h-full rounded-full bg-current transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${grown ? width : 0}%` }}
      />
    </span>
  );
};

/** One source: its icon and name, the count, and the share of the total. */
const SourceCard: React.FC<{ row: SourceRow; total: number; grown: boolean }> = ({ row, total, grown }) => {
  const ChannelIcon = CHANNEL_ICONS[row.channel];
  return (
    <li className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TINTS[row.channel]}`}>
          <ChannelIcon size={18} />
        </span>
        <h4 className="min-w-0 text-sm font-medium text-black dark:text-white">{CHANNEL_LABELS[row.channel]}</h4>
      </div>
      <p className="mt-4 text-title-lg font-bold tabular-nums text-black dark:text-white">
        {formatCount(row.count)}
        <span className="sr-only"> {applicationsNoun(row.count)}</span>
      </p>
      <div className="mt-3 flex items-center gap-3">
        <ShareBar row={row} total={total} grown={grown} />
        <span className="shrink-0 text-sm font-medium tabular-nums text-body dark:text-bodydark">
          {shareLabel(row.count, total)}
          <span className="sr-only"> of the total</span>
        </span>
      </div>
    </li>
  );
};

/** Applications with no source saved. A quiet line, not a fifth card: it only appears when there are some. */
const NotRecorded: React.FC<{ count: number; total: number }> = ({ count, total }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-dashed border-stroke px-4 py-3 text-sm dark:border-strokedark">
    <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-whiten text-body dark:bg-meta-4 dark:text-bodydark">
      <HelpCircle size={16} />
    </span>
    <span className="font-medium text-black dark:text-white">Not recorded</span>
    <span className="font-bold tabular-nums text-black dark:text-white">
      {formatCount(count)}
      <span className="sr-only"> {applicationsNoun(count)}</span>
    </span>
    <span className="text-body dark:text-bodydark">
      {shareLabel(count, total)}
      <span className="sr-only"> of the total.</span>
      <span aria-hidden="true"> · </span>
      No source was saved with these.
    </span>
  </div>
);

const LoadedResults: React.FC<{ summary: SourceSummary }> = ({ summary }) => {
  const grown = useGrown();
  return (
    <div className="space-y-4">
      <TotalBlock summary={summary} grown={grown} />
      {/* Four across only from xl, beside the 290px sidebar; two on tablets, one on phones. */}
      <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {summary.rows.map((row) => (
          <SourceCard key={row.channel} row={row} total={summary.total} grown={grown} />
        ))}
      </ul>
      {summary.notRecorded > 0 && <NotRecorded count={summary.notRecorded} total={summary.total} />}
    </div>
  );
};

/** The same shapes as the loaded page, so it does not jump when the numbers arrive. */
const ResultsSkeleton: React.FC = () => (
  <div aria-hidden="true" className="animate-pulse space-y-4 motion-reduce:animate-none">
    <div className="rounded-sm bg-whiter p-4 dark:bg-boxdark-2 sm:p-5">
      <div className="h-3 w-12 rounded bg-stroke dark:bg-strokedark" />
      <div className="mt-3 h-9 w-24 rounded bg-stroke dark:bg-strokedark md:h-11" />
      <div className="mt-4 h-3 rounded-full bg-stroke dark:bg-strokedark" />
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {[0, 1, 2, 3].map((slot) => (
        <div key={slot} className="rounded-sm border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark sm:p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-whiten dark:bg-meta-4" />
            <div className="h-4 w-28 rounded bg-whiten dark:bg-meta-4" />
          </div>
          <div className="mt-4 h-9 w-16 rounded bg-whiten dark:bg-meta-4" />
          <div className="mt-3 h-1.5 rounded-full bg-whiten dark:bg-meta-4" />
        </div>
      ))}
    </div>
  </div>
);

/** The tally for the days on screen; the skeleton while it is still on its way (`summary` null). */
const SourceResults: React.FC<{ summary: SourceSummary | null }> = ({ summary }) =>
  summary ? <LoadedResults summary={summary} /> : <ResultsSkeleton />;

export default SourceResults;
