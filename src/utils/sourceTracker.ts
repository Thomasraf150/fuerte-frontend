/**
 * The Source tracker's own logic (/applications/tracker), kept free of React and the
 * network so the Playwright runner tests it directly:
 * tests/e2e/27-application-page/source-tracker.spec.ts. It covers the period presets as
 * Manila calendar days, the line that names a range, and the per-source counts and shares.
 */
import type { ApplicationSourceCount, LoanApplicationChannel } from './DataTypes';
import { CHANNELS } from './applicationForm';

/** The calendar the business keeps. The server counts Manila days, so the page asks for Manila days. */
const MANILA = 'Asia/Manila';

/** A span of calendar days as `Y-m-d`, both ends inclusive: what getApplicationSourceCounts takes. */
export interface DayRange {
  from: string;
  to: string;
}

export type PresetPeriod = 'today' | 'week' | 'month' | 'lastMonth';
export type Period = PresetPeriod | 'custom';

/**
 * Today's calendar day in Manila as `Y-m-d`, whatever zone the browser is in. `now` is
 * always passed to Intl: with no argument it would read the system clock itself.
 */
export function manilaToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

// Day arithmetic is done on UTC midnights: they have no daylight saving and no browser zone in them.
const dayOf = (ymd: string): Date => {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const ymdOf = (date: Date): string => date.toISOString().slice(0, 10);

const shiftDays = (ymd: string, days: number): string => {
  const date = dayOf(ymd);
  date.setUTCDate(date.getUTCDate() + days);
  return ymdOf(date);
};

/** The whole of a month (1 to 12). Date.UTC carries a month of 0 or -1 into the year before, so January's "last month" works. */
const monthRange = (year: number, month: number): DayRange => ({
  from: ymdOf(new Date(Date.UTC(year, month - 1, 1))),
  to: ymdOf(new Date(Date.UTC(year, month, 0))),
});

/**
 * A preset's days, counted from `today` (a Manila `Y-m-d`). Whole calendar periods: the week
 * runs Monday to Sunday and a month from its first day to its last, so a label such as
 * "This month" names the same span all month. Days that have not happened yet hold no
 * applications, so counting them changes nothing.
 */
export function presetRange(preset: PresetPeriod, today: string = manilaToday()): DayRange {
  const [year, month] = today.split('-').map(Number);
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'week': {
      const sinceMonday = (dayOf(today).getUTCDay() + 6) % 7;
      const monday = shiftDays(today, -sinceMonday);
      return { from: monday, to: shiftDays(monday, 6) };
    }
    case 'month':
      return monthRange(year, month);
    case 'lastMonth':
      return monthRange(year, month - 1);
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Fixed month names, not Intl's: "Sep" reads the same on every phone, whatever locale data it ships. */
const dayLabel = (ymd: string, withYear: boolean): string => {
  const [year, month, day] = ymd.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}${withYear ? `, ${year}` : ''}`;
};

/** "Oct 1 – Oct 31, 2026"; both years when it crosses New Year; "Oct 1, 2026" for a single day. */
export function formatPeriod({ from, to }: DayRange): string {
  if (from === to) return dayLabel(from, true);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${dayLabel(from, !sameYear)} – ${dayLabel(to, true)}`;
}

export interface SourceRow {
  channel: LoanApplicationChannel;
  count: number;
}

export interface SourceSummary {
  /** Every application in the period, "Not recorded" included. */
  total: number;
  /** The four sources in the form's order, zeros kept. */
  rows: SourceRow[];
  /** Applications with no source saved: the server's `unknown`, and any channel this page has no card for. */
  notRecorded: number;
}

/** A server count as a whole number, never negative. */
const wholeCount = (value: unknown): number => Math.max(0, Math.trunc(Number(value)) || 0);

/** The server's per-channel counts as the four cards and the "Not recorded" remainder, so the total always adds up. */
export function summarizeSources(counts: readonly ApplicationSourceCount[]): SourceSummary {
  const known = new Map<string, number>();
  let notRecorded = 0;
  for (const { channel, count } of counts) {
    const n = wholeCount(count);
    if ((CHANNELS as readonly string[]).includes(channel)) {
      known.set(channel, (known.get(channel) ?? 0) + n);
    } else {
      notRecorded += n;
    }
  }
  const rows = CHANNELS.map((channel) => ({ channel, count: known.get(channel) ?? 0 }));
  return { total: rows.reduce((sum, row) => sum + row.count, notRecorded), rows, notRecorded };
}

/** The unit a screen reader hears after a count: "1 application", "24 applications". */
export const applicationsNoun = (count: number): string => (count === 1 ? 'application' : 'applications');

/** A count's share of the total, 0 to 1, for a bar's width. */
export const shareOf = (count: number, total: number): number => (total > 0 ? count / total : 0);

/**
 * A count's share as the card words it: "50%", or "—" when there is nothing to share.
 * Rounding never lies about the edges: a source with any applications is not "0%", and
 * one that is not everything is not "100%".
 */
export function shareLabel(count: number, total: number): string {
  if (total <= 0) return '—';
  if (count <= 0) return '0%';
  if (count >= total) return '100%';
  const percent = shareOf(count, total) * 100;
  return percent < 1 ? '<1%' : `${Math.min(99, Math.round(percent))}%`;
}
