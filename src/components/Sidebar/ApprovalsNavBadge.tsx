"use client";

import React from "react";
import { useDeletionRequestsStore } from "@/store/deletionRequestsStore";

/**
 * The red count on the sidebar's Approvals item: deletion requests still waiting for THIS user's
 * decision. Reads the store the bell already polls (every 30s, approver roles only), so it costs no
 * request of its own; for everyone else the count stays 0 and nothing is drawn.
 *
 * Unlike the bell, it is not "unseen": it stays until nothing is left to decide (CHR's sidebar rule,
 * "a hidden ask is no ask"). A count, not a dot, because how many are waiting changes how urgent it
 * is; capped at 99+ (Material badges). The words go to screen readers, not just the colour.
 */
const ApprovalsNavBadge: React.FC = () => {
  const count = useDeletionRequestsStore((s) => s.pendingCount);
  if (count <= 0) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-meta-1 px-1.5 text-xs font-bold tabular-nums leading-none text-white">
      {count > 99 ? "99+" : count}
      <span className="sr-only"> waiting for your decision</span>
    </span>
  );
};

export default ApprovalsNavBadge;
