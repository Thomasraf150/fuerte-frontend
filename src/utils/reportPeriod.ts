/**
 * The period a report opens on, so no dashboard or statement opens empty (2026-10-12,
 * following CHR, the owner's rebuild):
 *   - working screens (Summary Ticket, journals, vouchers): the last 30 days. A
 *     month-start default leaves them empty on the 1st of every month;
 *   - statements: month-to-date (Income Statement compares it with last month;
 *     General Ledger) or "as of" today (Balance Sheet, Trial Balance);
 *   - schedules (Notes Receivable, Commission): the whole current month.
 *
 * Days are Manila calendar days as `Y-m-d`, reusing the Source tracker's helpers, so a
 * report opened at 7am is not a day behind (toISOString would be). Free of React so a
 * Playwright spec can test it directly.
 */
import { manilaToday, presetRange, formatPeriod, shiftDays, type DayRange } from './sourceTracker';

export type { DayRange };
export { manilaToday, formatPeriod };

export type ReportPreset = 'last30' | 'thisMonth' | 'monthToDate' | 'lastMonth' | 'nextMonth';

export const PRESET_LABELS: Record<ReportPreset, string> = {
  last30: 'Last 30 days',
  thisMonth: 'This month',
  monthToDate: 'This month',
  lastMonth: 'Last month',
  nextMonth: 'Next month',
};

/** A preset's days, counted from `today` (a Manila `Y-m-d`), both ends inclusive. */
export function reportRange(preset: ReportPreset, today: string = manilaToday()): DayRange {
  switch (preset) {
    case 'last30':
      return { from: shiftDays(today, -29), to: today };
    case 'thisMonth':
      return presetRange('month', today);
    case 'monthToDate':
      return { from: `${today.slice(0, 8)}01`, to: today };
    case 'lastMonth':
      return presetRange('lastMonth', today);
    case 'nextMonth': {
      const [year, month] = today.split('-').map(Number);
      const first = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
      return presetRange('month', first);
    }
  }
}

/** "today", "1 day", "4 days": Manila calendar days since a server timestamp (Y-m-d H:i:s, Manila time). */
export function waitedFor(timestamp: string | null, today: string = manilaToday()): string {
  if (!timestamp) return '';
  const day = (ymd: string) => Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10)));
  const days = Math.max(0, Math.round((day(today) - day(timestamp.slice(0, 10))) / 86_400_000));
  return days === 0 ? 'today' : days === 1 ? '1 day' : `${days} days`;
}

/** `Y-m-d` → a local-midnight Date, which is what react-datepicker shows and moment formats back. */
export const dateOf = (ymd: string): Date => {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** A local Date → `Y-m-d` from its local parts (never toISOString, which shifts to UTC). */
export const ymdOf = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** A preset as the two Dates a pair of react-datepickers holds. */
export const presetDates = (preset: ReportPreset, today?: string): { start: Date; end: Date } => {
  const { from, to } = reportRange(preset, today);
  return { start: dateOf(from), end: dateOf(to) };
};

/** Which of `presets` the dates on screen are exactly, if any (to show it as pressed). */
export function matchingPreset(
  presets: readonly ReportPreset[],
  start: Date | null | undefined,
  end: Date | null | undefined,
  today?: string,
): ReportPreset | null {
  if (!start || !end) return null;
  const from = ymdOf(start);
  const to = ymdOf(end);
  return presets.find((p) => {
    const range = reportRange(p, today);
    return range.from === from && range.to === to;
  }) ?? null;
}
