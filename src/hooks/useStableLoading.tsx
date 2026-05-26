"use client";

import { useEffect, useState } from 'react';

/**
 * Keeps a loading indicator visible for at least `minHoldMs` after the
 * underlying mutation finishes. Without this, fast mutations on localhost
 * (~100-300ms) flash an overlay so briefly the user thinks nothing
 * happened. 600ms is a comfortable "the system is working" threshold.
 *
 * Use it to wrap any `loading` boolean that drives a visual overlay:
 *
 *   const { loading } = useLoans();
 *   const showOverlay = useStableLoading(loading);
 *   {showOverlay && <overlay />}
 */
export function useStableLoading(actualLoading: boolean, minHoldMs = 600): boolean {
  const [display, setDisplay] = useState(actualLoading);

  useEffect(() => {
    if (actualLoading) {
      setDisplay(true);
      return;
    }
    const t = setTimeout(() => setDisplay(false), minHoldMs);
    return () => clearTimeout(t);
  }, [actualLoading, minHoldMs]);

  return display;
}

export default useStableLoading;
