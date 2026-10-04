"use client";

import { useEffect, useRef, type RefObject } from 'react';

/**
 * A ref that takes focus once, when its element first appears, if `enabled` was true THEN.
 * The flag is read at mount, never watched: after a Retry the page can render once with the
 * flag already true while the OLD alert is still mounted (a hook may set "loading" only in its
 * effect, a render later), so an effect keyed on the flag would focus the alert that is about to
 * go, and a screen reader could read the stale error. Nor may an element that is re-rendered
 * later, with the flag still true, take focus again from whatever the user is doing.
 *
 * `opening` is an animation the element is still opening in, if any: focus waits for it,
 * because focusing a box that its own overflow still clips would scroll its content out of
 * place. Without one, focus is immediate.
 *
 * Used where a Retry has just removed the button the keyboard was on: the banner, card or alert
 * the Retry shows takes the focus (New Borrower's Create as borrower, the repeat-applicant check).
 */
export default function useFocusOnMount<T extends HTMLElement>(enabled: boolean, opening?: RefObject<Animation | null>): RefObject<T> {
  const ref = useRef<T>(null);
  const atMount = useRef(enabled);
  useEffect(() => {
    if (!atMount.current) return;
    const focus = (): void => ref.current?.focus();
    const running = opening?.current;
    if (running) running.finished.then(focus, () => undefined);
    else focus();
  }, [opening]);
  return ref;
}
