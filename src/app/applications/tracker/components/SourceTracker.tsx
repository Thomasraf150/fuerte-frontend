"use client";

import React, { useEffect, useId, useState } from 'react';
import { Users } from 'react-feather';
import { Card, CardBody, CardHeader } from '@/components/Card';
import LoadError from '@/app/applications/components/LoadError';
import { useAuthStore } from '@/store/authStore';
import useApplicationSourceCounts from '@/hooks/useApplicationSourceCounts';
import { formatCount } from '@/utils/helper';
import { applicationsNoun, formatPeriod, presetRange, summarizeSources, type DayRange, type Period } from '@/utils/sourceTracker';
import FunnelPanel from './FunnelPanel';
import PeriodPicker from './PeriodPicker';
import SourceResults from './SourceResults';

/**
 * Whose applications are counted. The server decides (Owner and Admin count every branch, Call
 * Center its own branch group's -- one account per group, 2026-10-08 -- everyone else their
 * own); this only says so. null until the role has been read after mount.
 */
const scopeLine = (roleCode: string | null | undefined): string | null => {
  if (roleCode === null) return null;
  if (roleCode === 'OWN' || roleCode === 'ADM') return 'All branches';
  return roleCode === 'CALLCTR' ? "Your group's branches" : 'Your branches';
};

/** The signed-in role code, read after mount (the persisted store exists only in the browser); null before. */
const useRoleCode = (): string | null | undefined => {
  const [code, setCode] = useState<string | null | undefined>(null);
  useEffect(() => {
    setCode(useAuthStore.getState().user?.role?.code);
  }, []);
  return code;
};

/** The days being counted and whose applications they are: always on screen, so every state (loading, an error, the tally) has its context. */
const MetaLine: React.FC<{ range: DayRange; scope: string | null }> = ({ range, scope }) => (
  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-body dark:text-bodydark">
    <span className="font-medium text-black dark:text-white">{formatPeriod(range)}</span>
    <span aria-hidden="true" className="text-bodydark2">·</span>
    <span className="sr-only">, </span>
    <Users aria-hidden="true" size={14} className="shrink-0" />
    {/* Until the role is read, a non-breaking space holds the line's height. */}
    <span>{scope ?? ' '}</span>
  </p>
);

/**
 * Source tracker (/applications/tracker): how many applications came from each Saan
 * galing source in a period, with each source's share, and under it the applicant funnel for
 * the same days (FunnelPanel). This month to start; the days on screen are `range`, and the
 * chosen chip is `period`.
 */
const SourceTracker: React.FC = () => {
  const headingId = useId();
  const [period, setPeriod] = useState<Period>('month');
  const [range, setRange] = useState<DayRange>(() => presetRange('month'));
  const { counts, loading, error, refresh } = useApplicationSourceCounts(range);
  const scope = scopeLine(useRoleCode());
  const summary = counts ? summarizeSources(counts) : null;

  const select = (next: Period) => {
    setPeriod(next);
    // Custom keeps the days on screen: its boxes start from them, and Apply is what changes them.
    if (next !== 'custom') setRange(presetRange(next));
  };

  // Said once to screen readers, since the change is on screen and the chip that caused it is not.
  const status = loading
    ? 'Loading the counts…'
    : summary
      ? `${formatCount(summary.total)} ${applicationsNoun(summary.total)}, ${formatPeriod(range)}${scope ? `, ${scope}` : ''}`
      : '';

  return (
    <div className="space-y-4 md:space-y-6">
      <Card aria-labelledby={headingId}>
        <CardHeader id={headingId} title="Applications by source" description="Counted by the day the person applied." />
        {/* The same padding as the Applications list, so the two pages line up. */}
        <CardBody>
          <PeriodPicker period={period} range={range} onSelect={select} onApplyCustom={setRange} />
          <MetaLine range={range} scope={scope} />
          <p role="status" className="sr-only">{status}</p>
          <div aria-busy={loading}>
            {error ? <LoadError message={error} onRetry={refresh} /> : <SourceResults summary={summary} />}
          </div>
        </CardBody>
      </Card>
      <FunnelPanel range={range} />
    </div>
  );
};

export default SourceTracker;
