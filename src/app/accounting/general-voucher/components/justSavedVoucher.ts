/**
 * Keeps a just-saved voucher on the list it returns to. The list opens on the last 30 days,
 * sorted newest-made first, so a voucher dated outside that window used to vanish straight
 * after Save (Accounting, 2026-11-26: "hindi na namin makita"). The form notes the saved
 * journal date for this tab; the list reads it once and widens its dates to take it in.
 */
import { manilaToday, reportRange } from '@/utils/reportPeriod';

const KEY = 'gv:justSavedJournalDate';
const isDev = process.env.NODE_ENV === 'development';

const REF_KEY = 'gv:justSavedJournalRef';

/**
 * After a successful save: remember the voucher's journal date (Y-m-d) for this tab. An edited
 * voucher keeps its old place in the newest-first list, so a date change also passes its ref,
 * which the list then searches for (inside the widened dates).
 */
export function rememberSavedJournalDate(journalDate: string | null | undefined, journalRef?: string | null): void {
  const ymd = String(journalDate ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return;
  try {
    window.sessionStorage.setItem(KEY, ymd);
    if (journalRef) window.sessionStorage.setItem(REF_KEY, journalRef);
  } catch (e) {
    // Private window or blocked storage: the list just opens on its usual period.
    if (isDev) console.warn('[justSavedVoucher] could not remember the saved date', e);
  }
}

/** Read once and forget: the ref of a voucher whose date was just changed, for the list's search. */
export function takeSavedVoucherRef(): string | null {
  try {
    const ref = window.sessionStorage.getItem(REF_KEY);
    window.sessionStorage.removeItem(REF_KEY);
    return ref;
  } catch (e) {
    if (isDev) console.warn('[justSavedVoucher] could not read the saved ref', e);
    return null;
  }
}

/**
 * Read once and forget: the list's opening range widened to include the just-saved
 * voucher's date, or null when nothing was saved or the date is already inside the
 * last 30 days.
 */
export function takeSavedJournalRange(today: string = manilaToday()): { from: string; to: string; saved: string } | null {
  let saved: string | null = null;
  try {
    saved = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
  } catch (e) {
    if (isDev) console.warn('[justSavedVoucher] could not read the saved date', e);
    return null;
  }
  if (!saved || !/^\d{4}-\d{2}-\d{2}$/.test(saved)) return null;
  const { from, to } = reportRange('last30', today);
  if (saved >= from && saved <= to) return null;
  return { from: saved < from ? saved : from, to: saved > to ? saved : to, saved };
}
