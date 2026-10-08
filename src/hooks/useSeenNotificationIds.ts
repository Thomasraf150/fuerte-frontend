"use client";

import { useCallback, useEffect, useState } from 'react';

/**
 * Where the bell keeps what the user has seen: deletion request ids and Applications item keys, in
 * one list PER USER. Until 2026-10-08 it was one list for everyone on the browser
 * ('fuerte.notif.seenIds'), so on a shared office PC one person opening the bell hid the badge from
 * the next person who logged in (Rafael's test: Processing opened it, then Marketing saw no badge).
 */
const LEGACY_KEY = 'fuerte.notif.seenIds';
const keyFor = (userId: string | number): string => `${LEGACY_KEY}:${userId}`;

/**
 * The list as last kept for this user, or none (no window during SSR, no user yet, nothing stored,
 * storage blocked, or a value that is not a list: corrupt storage must never crash the header).
 * Entries are read as strings.
 */
const readSeenIds = (userId: string | number | null | undefined): string[] => {
  if (typeof window === 'undefined' || userId == null || userId === '') return [];
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
};

/**
 * The header bell's "seen" tracking. `currentIds` is everything on the bell now; `unseenCount` is how
 * many of them this user has not acknowledged, so a newly polled id brings the badge back by itself.
 * `markAllSeen` (the bell opening) REPLACES the user's kept list with the current one, which also drops
 * ids that are no longer on the bell and keeps localStorage tidy; with nothing on the bell it keeps the
 * list as it is. The signed-in user arrives after the first render (the auth store hydrates then), so
 * the list is read again whenever `userId` changes. Without a user nothing is kept. Storage that is
 * full or blocked is ignored: the badge then just resets next session.
 */
export default function useSeenNotificationIds(
  currentIds: string[],
  userId: string | number | null | undefined,
): { unseenCount: number; markAllSeen: () => void } {
  const [seenIds, setSeenIds] = useState<string[]>(() => readSeenIds(userId));
  useEffect(() => {
    setSeenIds(readSeenIds(userId));
  }, [userId]);
  const unseenCount = currentIds.filter((id) => !seenIds.includes(id)).length;

  const markAllSeen = useCallback(() => {
    if (currentIds.length === 0) return;
    setSeenIds(currentIds);
    if (typeof window === 'undefined' || userId == null || userId === '') return;
    try {
      window.localStorage.setItem(keyFor(userId), JSON.stringify(currentIds));
      window.localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Full or blocked: ignore.
    }
  }, [currentIds, userId]);

  return { unseenCount, markAllSeen };
}
