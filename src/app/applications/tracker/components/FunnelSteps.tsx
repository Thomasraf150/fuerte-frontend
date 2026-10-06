"use client";

import React from 'react';
import Link from 'next/link';
import {
  FUNNEL_EXCEPTIONS,
  FUNNEL_EXITS,
  FUNNEL_STEPS,
  FUNNEL_WAITING,
  funnelHref,
  type FunnelItem,
} from '@/utils/applicationFunnel';
import type { ApplicationFunnelCounts } from '@/utils/DataTypes';
import { formatCount } from '@/utils/helper';
import { shareLabel, shareOf, type DayRange } from '@/utils/sourceTracker';

const RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark';

/** "01" … "04": the website's numerals, gold Fraunces. */
const stepNumber = (index: number): string => String(index + 1).padStart(2, '0');

/**
 * A number that opens the Applications list filtered to exactly those applications, for the days
 * on screen. Where the list has no filter for them it is plain text (FunnelItem.target is null).
 * The link's name is the number and what it counts: "12 Got a loan".
 */
const CountLink: React.FC<{ item: FunnelItem; count: number; range: DayRange; className: string }> = ({ item, count, range, className }) => {
  const href = funnelHref(item.target, range);
  const text = (
    <>
      {formatCount(count)}
      <span className="sr-only"> {item.label}</span>
    </>
  );
  if (!href) return <span className={className}>{text}</span>;
  return (
    <Link
      href={href}
      prefetch={false}
      className={`${className} rounded-sm underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-accent ${RING}`}
    >
      {text}
    </Link>
  );
};

/**
 * One of the four steps: its gold numeral and name, the count in Fraunces (a link), and below it
 * how many of those who applied got this far, as words and as an olive bar that narrows step by
 * step. The first step is everyone, so it says so instead of "100%".
 */
const Step: React.FC<{ item: FunnelItem; index: number; counts: ApplicationFunnelCounts; range: DayRange; grown: boolean }> = ({
  item,
  index,
  counts,
  range,
  grown,
}) => {
  const count = counts[item.key];
  const share = index === 0 ? (counts.applied > 0 ? 1 : 0) : shareOf(count, counts.applied);
  return (
    <li data-step={item.key} className="flex flex-col rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:p-5">
      <p className="flex items-baseline gap-2.5">
        <span aria-hidden="true" className="font-display text-2xl font-semibold leading-none text-accent">
          {stepNumber(index)}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-body dark:text-bodydark">{item.label}</span>
      </p>
      <p className="mt-3 font-display text-title-xl font-semibold leading-none tabular-nums tracking-tight text-black dark:text-white md:text-title-xxl">
        <CountLink item={item} count={count} range={range} className="inline-flex min-h-12 items-center" />
      </p>
      <p className="mt-2 text-sm text-body dark:text-bodydark" data-testid="step-share">
        {index === 0 ? (
          'Everyone who applied'
        ) : (
          <>
            <span className="font-semibold tabular-nums text-black dark:text-white">{shareLabel(count, counts.applied)}</span> of applied
          </>
        )}
      </p>
      <span aria-hidden="true" className="mt-3 block h-1.5 overflow-hidden rounded-full bg-primary/10 dark:bg-primary/20">
        <span
          className="block h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${grown ? Math.max(share * 100, share > 0 ? 2 : 0) : 0}%`, transitionDelay: `${index * 90}ms` }}
        />
      </span>
    </li>
  );
};

/** Applied → Became borrower → Approved → Got a loan: one row from xl, two on tablets, stacked on phones. */
export const FunnelStepList: React.FC<{ counts: ApplicationFunnelCounts; range: DayRange; grown: boolean }> = ({ counts, range, grown }) => (
  <ol aria-label="Funnel steps" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
    {FUNNEL_STEPS.map((item, index) => (
      <Step key={item.key} item={item} index={index} counts={counts} range={range} grown={grown} />
    ))}
  </ol>
);

type GroupTone = 'exit' | 'waiting' | 'exception';

const DOT: Record<GroupTone, string> = {
  exit: 'bg-danger',
  waiting: 'bg-bodydark2',
  exception: 'bg-warning',
};

const ROW =
  'flex min-h-12 items-center gap-2.5 px-3 text-sm text-black dark:text-white lg:min-h-10';

/** One stage: its dot, its name and its count, the whole row a link when the list can show them. */
const StageRow: React.FC<{ item: FunnelItem; count: number; range: DayRange; tone: GroupTone }> = ({ item, count, range, tone }) => {
  const href = funnelHref(item.target, range);
  const body = (
    <>
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${DOT[tone]}`} />
      <span className="min-w-0 flex-1">{item.label}</span>
      <span className="font-display text-lg font-semibold tabular-nums">{formatCount(count)}</span>
    </>
  );
  return (
    <li data-stage={item.key}>
      {href ? (
        <Link
          href={href}
          prefetch={false}
          aria-label={`${formatCount(count)} ${item.label}`}
          className={`${ROW} rounded-sm transition-colors hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 ${RING}`}
        >
          {body}
        </Link>
      ) : (
        <div className={ROW}>{body}</div>
      )}
    </li>
  );
};

const GROUP_BOX: Record<GroupTone, string> = {
  exit: 'border-stroke bg-white dark:border-strokedark dark:bg-boxdark',
  waiting: 'border-stroke bg-white dark:border-strokedark dark:bg-boxdark',
  exception: 'border-warning/60 bg-warning/10',
};

/** A titled list of stages: who left, who is still waiting, and what should not have happened. */
const StageGroup: React.FC<{ title: string; hint: string; items: readonly FunnelItem[]; counts: ApplicationFunnelCounts; range: DayRange; tone: GroupTone }> = ({
  title,
  hint,
  items,
  counts,
  range,
  tone,
}) => (
  <section aria-label={title} className={`rounded-sm border py-2 ${GROUP_BOX[tone]}`}>
    <h4 className="px-3 pt-1 text-xs font-semibold uppercase tracking-[0.08em] text-black dark:text-white">{title}</h4>
    <p className="px-3 text-xs text-body dark:text-bodydark">{hint}</p>
    <ul className="mt-1">
      {items.map((item) => (
        <StageRow key={item.key} item={item} count={counts[item.key]} range={range} tone={tone} />
      ))}
    </ul>
  </section>
);

/**
 * Under the steps: the exits and the waiting stages always, side by side from md; the exceptions
 * only when one of them happened, and then only those that did, in amber.
 */
export const FunnelBreakdown: React.FC<{ counts: ApplicationFunnelCounts; range: DayRange }> = ({ counts, range }) => {
  const exceptions = FUNNEL_EXCEPTIONS.filter((item) => counts[item.key] > 0);
  return (
    <div className="grid grid-cols-1 items-start gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
      <StageGroup title="Left" hint="Someone said no, or the loan was cancelled." items={FUNNEL_EXITS} counts={counts} range={range} tone="exit" />
      <StageGroup title="Still waiting" hint="Waiting on a step." items={FUNNEL_WAITING} counts={counts} range={range} tone="waiting" />
      {exceptions.length > 0 && (
        <StageGroup title="Look into these" hint="These should not happen." items={exceptions} counts={counts} range={range} tone="exception" />
      )}
    </div>
  );
};
