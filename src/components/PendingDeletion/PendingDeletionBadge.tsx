"use client";

import React from "react";
import { AlertCircle } from "react-feather";
import type { PendingDeletionInfo } from "@/hooks/usePendingDeletions";
import Tooltip from "@/components/Tooltip";
import "./PendingDeletionBadge.css";

interface Props {
  info: PendingDeletionInfo;
  /** When provided, badge is clickable and opens the details modal. */
  onClick?: () => void;
  /** Optional className for additional layout control from the parent row. */
  className?: string;
}

function timeAgo(iso: string): string {
  const t = new Date(iso.replace(" ", "T")).getTime();
  if (Number.isNaN(t)) return iso;
  const seconds = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso.replace(" ", "T")).toLocaleDateString();
}

/**
 * Compact icon-only marker for rows under a pending deletion request.
 * Uses react-feather's AlertCircle (the `!` icon) to match the rest of
 * Fuerte's iconography. Colour communicates whose request it is:
 *
 *   amber   → someone else's pending request
 *   cyan    → your own pending request
 */
const PendingDeletionBadge: React.FC<Props> = ({ info, onClick, className }) => {
  const ts = timeAgo(info.created_at);
  const tipText = info.is_mine
    ? `Your request · ${ts}`
    : `${info.requested_by_name ?? "Someone"} · ${ts}`;

  return (
    <Tooltip text={tipText}>
      <button
        type="button"
        onClick={onClick}
        className={`pending-deletion-badge ${info.is_mine ? "is-mine" : ""} ${className ?? ""}`.trim()}
        aria-label={`Pending deletion — ${tipText}. Click for details.`}
      >
        <AlertCircle size={16} aria-hidden />
      </button>
    </Tooltip>
  );
};

export default PendingDeletionBadge;
