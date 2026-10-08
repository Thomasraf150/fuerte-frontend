import React from 'react';
import StatusBadge, { type StatusTone } from '@/components/StatusBadge';

/**
 * Batch status as the office reads it, not as the database stores it.
 * Shared by the batch list and the review screen so the two can never
 * disagree about the same batch. Renders the shared StatusBadge (word + icon
 * + colour); the words are the office's, the tones follow the badge's meanings.
 */
const STATUS: Record<string, { tone: StatusTone; label: string }> = {
  uploaded: { tone: 'neutral', label: 'Uploaded' },
  validating: { tone: 'progress', label: 'Checking…' },
  validated: { tone: 'approved', label: 'Checked' },
  committing: { tone: 'progress', label: 'Posting…' },
  committed: { tone: 'posted', label: 'Posted' },
  reversed: { tone: 'closed', label: 'Cancelled' },
  failed: { tone: 'danger', label: 'Failed' },
};

export default function StatusPill({
  status,
}: {
  status: string;
  /** Kept so existing callers compile; the badge has one size. */
  size?: 'sm' | 'md';
}) {
  const s = STATUS[status] ?? { tone: 'neutral' as StatusTone, label: status };
  return <StatusBadge tone={s.tone}>{s.label}</StatusBadge>;
}
