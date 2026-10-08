import React from 'react';

interface Props {
  /** How many placeholder rows to draw (default 4). */
  rows?: number;
  /** What is loading, for screen readers ("Loading the loan…"). */
  label?: string;
  className?: string;
}

/**
 * A page-shaped placeholder for a card or section that is loading (UI modernisation B, Phase 6):
 * grey rows where the content will be, instead of a big centred spinner. Use it for containers on
 * waits that can pass a second (NN/g: skeletons for 1-10s waits; Carbon: only on container-based
 * components); a button keeps its own "Saving…" text. It stops pulsing under prefers-reduced-motion.
 */
const SkeletonBlock: React.FC<Props> = ({ rows = 4, label = 'Loading…', className = '' }) => (
  <div role="status" className={`space-y-3 ${className}`}>
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        aria-hidden="true"
        className="h-10 animate-pulse rounded-lg bg-stroke motion-reduce:animate-none dark:bg-meta-4"
        style={{ width: i === 0 ? '60%' : i % 3 === 2 ? '80%' : '100%', animationDelay: `${i * 60}ms` }}
      />
    ))}
  </div>
);

export default SkeletonBlock;
