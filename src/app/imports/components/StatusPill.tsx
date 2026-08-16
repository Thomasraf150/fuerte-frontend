import React from 'react';

/**
 * Batch status as the office reads it, not as the database stores it.
 * Shared by the batch list and the review screen so the two can never
 * disagree about the same batch — they previously carried duplicate maps
 * with a comment asking whoever edited one to remember the other.
 */
/**
 * Uses theme tokens, NOT `red-*` / `gray-*`: this project's tailwind config
 * sets `red` and `gray` to single hex strings, so every numbered shade of
 * those two palettes is a dead class that renders unstyled. `next build`
 * does not catch it.
 */
const STATUS: Record<string, { cls: string; label: string }> = {
  uploaded: { cls: 'bg-whiten text-body', label: 'Uploaded' },
  validating: { cls: 'bg-blue-100 text-blue-700', label: 'Checking…' },
  validated: { cls: 'bg-blue-100 text-blue-700', label: 'Checked' },
  committing: { cls: 'bg-amber-100 text-amber-700', label: 'Posting…' },
  committed: { cls: 'bg-green-100 text-green-700', label: 'Posted' },
  reversed: { cls: 'bg-rose-100 text-rose-700', label: 'Cancelled' },
  failed: { cls: 'bg-danger/10 text-danger', label: 'Failed' },
};

export default function StatusPill({
  status,
  size = 'md',
}: {
  status: string;
  size?: 'sm' | 'md';
}) {
  const s = STATUS[status] ?? { cls: 'bg-whiten text-body', label: status };
  const pad = size === 'sm' ? 'px-2.5 py-0.5' : 'px-3 py-1';
  return (
    <span className={`rounded-full ${pad} text-xs font-medium uppercase tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}
