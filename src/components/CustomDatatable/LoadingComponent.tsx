import React from 'react';

/**
 * Loading rows shaped like the table (shared table v2 item 5): six rows of `columns` bars,
 * instead of a 256px spinner that made every list jump. Screen readers hear "Loading…" once,
 * from the status region. The bars stop pulsing for people who ask for reduced motion.
 */
const DataTableLoadingComponent: React.FC<{ columns?: number }> = ({ columns = 4 }) => {
  const cells = Array.from({ length: Math.max(1, Math.min(columns, 12)) });

  return (
    <div role="status" className="w-full bg-white dark:bg-boxdark">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: 6 }).map((_, row) => (
        <div key={row} aria-hidden="true" className="flex h-12 items-center gap-4 border-b border-stroke px-2 dark:border-strokedark">
          {cells.map((__, cell) => (
            <div
              key={cell}
              className="h-3 flex-1 animate-pulse rounded bg-stroke motion-reduce:animate-none dark:bg-meta-4"
              style={{ maxWidth: cell === 0 ? '40%' : undefined, animationDelay: `${row * 60}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default DataTableLoadingComponent;
