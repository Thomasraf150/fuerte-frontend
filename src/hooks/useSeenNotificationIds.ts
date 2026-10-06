"use client";

import { useCallback, useState } from 'react';

/** Where the bell keeps what the user has seen: deletion request ids and Applications item keys, in one list. */
const SEEN_KEY = 'fuerte.notif.seenIds';

/**
 * The list as last kept, or none (no window during SSR, nothing stored, storage blocked, or a value
 * that is not a list: corrupt storage must never crash the header). Entries are read as strings.
 */
const readSeenIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
};

/**
 * The header bell's "seen" tracking. `currentIds` is everything on the bell now; `unseenCount` is how
 * many of them the user has not acknowledged, so a newly polled id brings the badge back by itself.
 * `markAllSeen` (the bell opening) REPLACES the kept list with the current one, which also drops ids
 * that are no longer on the bell and keeps localStorage tidy; with nothing on the bell it keeps the
 * list as it is. Storage that is full or blocked is ignored: the badge then just resets next session.
 */
export default function useSeenNotificationIds(currentIds: string[]): { unseenCount: number; markAllSeen: () => void } {
  const [seenIds, setSeenIds] = useState<string[]>(readSeenIds);
  const unseenCount = currentIds.filter((id) => !seenIds.includes(id)).length;

  const markAllSeen = useCallback(() => {
    if (currentIds.length === 0) return;
    setSeenIds(currentIds);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SEEN_KEY, JSON.stringify(currentIds));
    } catch {
      // Full or blocked: ignore.
    }
  }, [currentIds]);

  return { unseenCount, markAllSeen };
}
