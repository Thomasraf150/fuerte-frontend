"use client";

import React, { useEffect, useId, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/Card';
import LoadError from '@/app/applications/components/LoadError';
import useApplicationFunnel from '@/hooks/useApplicationFunnel';
import { FUNNEL_STEPS, channelName } from '@/utils/applicationFunnel';
import type { ApplicationFunnel, ApplicationFunnelCounts } from '@/utils/DataTypes';
import { formatCount } from '@/utils/helper';
import { applicationsNoun, formatPeriod, type DayRange } from '@/utils/sourceTracker';
import { FunnelBreakdown, FunnelStepList } from './FunnelSteps';

/** False until the first frame after the funnel mounts, so its bars grow to their width (as the source cards' do). */
function useGrown(): boolean {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return grown;
}

const CELL = 'px-2 py-2.5 text-right tabular-nums sm:px-3';

/** One source's row: its name, then the four steps. */
const ChannelRow: React.FC<{ name: string; counts: ApplicationFunnelCounts; total?: boolean }> = ({ name, counts, total }) => (
  <tr className={total ? 'border-t-2 border-stroke font-semibold dark:border-strokedark' : 'border-t border-stroke dark:border-strokedark'}>
    <th scope="row" className="break-words px-2 py-2.5 text-left font-medium text-black dark:text-white sm:px-3">
      {name}
    </th>
    {FUNNEL_STEPS.map((step) => (
      <td key={step.key} className={`${CELL} text-black dark:text-white`}>
        {formatCount(counts[step.key])}
      </td>
    ))}
  </tr>
);

/**
 * The four steps per Saan galing source, with every source as a row and the whole period as the
 * last. The cells are plain numbers: the Applications list has no source filter, so a link from a
 * cell could only open more than it counts. Fixed layout and wrapping headers keep it inside a
 * 360px screen.
 */
const ByChannelTable: React.FC<{ funnel: ApplicationFunnel }> = ({ funnel }) => {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId}>
      <h4 id={titleId} className="font-display text-lg font-semibold text-black dark:text-white">By source</h4>
      <div className="mt-2 overflow-x-auto rounded-sm border border-stroke dark:border-strokedark">
        <table aria-labelledby={titleId} className="w-full table-fixed text-xs sm:text-sm">
          <thead className="bg-whiter text-body dark:bg-boxdark-2 dark:text-bodydark">
            <tr>
              <th scope="col" className="w-[28%] px-2 py-2 text-left font-semibold sm:px-3">Source</th>
              {FUNNEL_STEPS.map((step) => (
                <th key={step.key} scope="col" className="px-2 py-2 text-right font-semibold leading-tight sm:px-3">
                  {step.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {funnel.by_channel.map((row) => (
              <ChannelRow key={row.channel} name={channelName(row.channel)} counts={row.counts} />
            ))}
          </tbody>
          <tfoot>
            <ChannelRow name="All sources" counts={funnel.total} total />
          </tfoot>
        </table>
      </div>
    </section>
  );
};

const Loaded: React.FC<{ funnel: ApplicationFunnel; range: DayRange }> = ({ funnel, range }) => {
  const grown = useGrown();
  return (
    <div className="space-y-5">
      <FunnelStepList counts={funnel.total} range={range} grown={grown} />
      {funnel.total.applied === 0 && <p className="text-sm text-body dark:text-bodydark">No applications in this period.</p>}
      <FunnelBreakdown counts={funnel.total} range={range} />
      <ByChannelTable funnel={funnel} />
    </div>
  );
};

/** The steps' shapes while the funnel is on its way, so nothing jumps when it arrives. */
const Skeleton: React.FC = () => (
  <div aria-hidden="true" className="grid animate-pulse grid-cols-1 gap-3 motion-reduce:animate-none sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
    {[0, 1, 2, 3].map((slot) => (
      <div key={slot} className="rounded-lg bg-whiten p-4 dark:bg-meta-4 sm:p-5">
        <div className="h-5 w-24 rounded bg-stroke dark:bg-strokedark" />
        <div className="mt-3 h-10 w-20 rounded bg-stroke dark:bg-strokedark" />
        <div className="mt-3 h-1.5 rounded-full bg-stroke dark:bg-strokedark" />
      </div>
    ))}
  </div>
);

/**
 * The applicant funnel (Source tracker, under the source counts): for the days applied on screen,
 * how many became a borrower, were approved and got a loan, where the rest left or wait, and any
 * exceptions. Every number that the Applications list can show opens it, filtered to those
 * applications and those days.
 */
const FunnelPanel: React.FC<{ range: DayRange }> = ({ range }) => {
  const headingId = useId();
  const { funnel, loading, error, refresh } = useApplicationFunnel(range);
  const status = loading
    ? 'Loading the funnel…'
    : funnel
      ? `Funnel: ${formatCount(funnel.total.applied)} ${applicationsNoun(funnel.total.applied)}, ${formatCount(funnel.total.loan_released)} got a loan`
      : '';
  return (
    <Card aria-labelledby={headingId}>
      <CardHeader
        id={headingId}
        title="From application to loan"
        description={<>Applied {formatPeriod(range)}. Where each applicant is now. Tap a number to see them.</>}
      />
      <CardBody>
        <p role="status" className="sr-only">{status}</p>
        <div aria-busy={loading}>
          {error ? <LoadError message={error} onRetry={refresh} /> : funnel ? <Loaded funnel={funnel} range={range} /> : <Skeleton />}
        </div>
      </CardBody>
    </Card>
  );
};

export default FunnelPanel;
