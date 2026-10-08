import React from 'react';

/**
 * The loan summary, shared by the loan page, Payment Posting and the Statement of Account
 * (Phase 4, 2026-10-08). Before it, each page carried its own copy of Row/Panel and drew three
 * separate boxes.
 *
 *   KeyValueColumns  one card, split into columns by hairlines on md+ and stacked with dividers on phones
 *   KeyValueList     one column of label / value pairs (a <dl>)
 *   KeyValueRow      label left (muted), value right in tabular figures; `total` is the one emphasised figure
 */
export const KeyValueColumns: React.FC<{ children: React.ReactNode; columns?: 2 | 3; className?: string }> = ({
  children,
  columns = 3,
  className = '',
}) => (
  <div
    className={`grid grid-cols-1 divide-y divide-stroke overflow-hidden rounded-lg border border-stroke bg-white md:divide-x md:divide-y-0 dark:divide-strokedark dark:border-strokedark dark:bg-boxdark ${
      columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
    } ${className}`}
  >
    {children}
  </div>
);

export const KeyValueList: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <dl className={`min-w-0 p-4 ${className}`}>{children}</dl>
);

export const KeyValueRow: React.FC<{
  label: string;
  children: React.ReactNode;
  total?: boolean;
  valueClass?: string;
}> = ({ label, children, total = false, valueClass = '' }) => (
  <div
    className={`flex items-baseline justify-between gap-4 py-1.5 ${
      total ? 'mt-1 border-t border-stroke pt-3 dark:border-strokedark' : 'text-sm'
    }`}
  >
    <dt className={total ? 'text-sm font-semibold text-black dark:text-white' : 'text-sm text-body dark:text-bodydark'}>{label}</dt>
    <dd
      className={`text-right tabular-nums text-black dark:text-white ${
        total ? 'text-xl font-bold' : ''
      } ${valueClass}`}
    >
      {children}
    </dd>
  </div>
);
