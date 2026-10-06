"use client";

import React from "react";
import { Check, X } from "react-feather";
import type { BorrowerDecision } from "@/utils/DataTypes";

interface DecisionPillProps {
  decision?: BorrowerDecision | null;
  /** 'lg' (default): beside PayerBadge on the borrower page. 'sm': inline in a sentence (the converted application page). */
  size?: "sm" | "lg";
}

const SIZE: Record<NonNullable<DecisionPillProps["size"]>, { box: string; icon: number }> = {
  lg: { box: "px-3 py-1 text-sm", icon: 15 },
  sm: { box: "px-2 py-0.5 text-xs align-middle", icon: 12 },
};

const LABEL: Record<BorrowerDecision["status"], string> = {
  approved: "Approved",
  rejected: "Rejected",
};

// The same squared stamp as PayerBadge's 'lg' size, so the two verdicts sit together as a pair.
// Approved is quiet: a neutral outline, a success check and ink text (a green Approved would be the
// third green beside the FB branch chip and the Good stamp). Rejected is the one loud stamp: filled
// danger. The word is always there, so colour is never the only signal.
const TONE: Record<BorrowerDecision["status"], string> = {
  approved: "border-stroke bg-white text-black dark:border-strokedark dark:bg-boxdark dark:text-white",
  rejected: "border-danger bg-danger text-white",
};

/**
 * A borrower's latest Approved / Rejected decision as a stamp: the borrower page header and the
 * converted application page use this one component, so both say it the same way. Nothing before
 * the first decision.
 */
const DecisionPill: React.FC<DecisionPillProps> = ({ decision, size = "lg" }) => {
  if (!decision || !LABEL[decision.status]) return null;
  const Icon = decision.status === "approved" ? Check : X;

  return (
    <span
      data-decision={decision.status}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded border font-semibold tracking-wide ${SIZE[size].box} ${TONE[decision.status]}`}
    >
      <Icon
        aria-hidden="true"
        size={SIZE[size].icon}
        strokeWidth={3}
        className={`-ml-0.5 shrink-0 ${decision.status === "approved" ? "text-success dark:text-meta-3" : ""}`}
      />
      {LABEL[decision.status]}
    </span>
  );
};

/** "2026-10-05 14:30:00" (the server's Manila wall clock) → "Oct 5, 2026", in any browser zone. */
export const formatDecidedOn = (decidedAt: string): string => {
  // The string carries no zone: pin it to Manila (+08:00, no daylight saving) and format in Manila.
  const date = new Date(`${decidedAt.replace(" ", "T")}+08:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" });
};

/** The quiet line under the stamps: "Rejected Oct 5, 2026 · Kulang ang income", "Approved Oct 5, 2026". */
export const decisionLine = (decision: BorrowerDecision): string =>
  [`${LABEL[decision.status]} ${formatDecidedOn(decision.decided_at)}`.trim(), decision.reason?.trim()]
    .filter(Boolean)
    .join(" · ");

export default DecisionPill;
