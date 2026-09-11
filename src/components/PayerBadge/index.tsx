"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "react-feather";
import type { PayerStanding } from "@/utils/DataTypes";

interface PayerBadgeProps {
  standing?: PayerStanding | null;
  /** The Problem pill links to this borrower's Problem Accounts page. */
  borrowerId?: string | number | null;
  /** 'sm' (default) for table rows, 'lg' for the borrower page */
  size?: 'sm' | 'lg';
}

const LABEL: Record<PayerStanding, string> = {
  GOOD: 'Good',
  PROBLEM: 'Problem',
  NONE: 'None',
};

// A squared "ledger stamp", deliberately unlike the round BranchBadge beside
// it, so a green Good is never read as the green FB branch. Only Problem is
// filled. Every pairing clears WCAG AA at text-xs — the `success` token
// (#219653) does not, hence green-800 — and `red-*`/`gray-*` shades are dead in
// this Tailwind config, so danger/stroke/body tokens are used instead.
const TONE: Record<PayerStanding, string> = {
  GOOD: 'border-green-700/40 text-green-800 dark:border-meta-3/50 dark:text-meta-3',
  PROBLEM: 'border-danger bg-danger text-white hover:border-meta-1 hover:bg-meta-1',
  NONE: 'border-stroke text-body dark:border-strokedark dark:text-bodydark',
};

const PayerBadge: React.FC<PayerBadgeProps> = ({ standing, borrowerId, size = 'sm' }) => {
  if (!standing || !LABEL[standing]) return null;

  const base = `inline-flex items-center rounded border font-semibold tracking-wide whitespace-nowrap ${
    size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'
  } ${TONE[standing]}`;

  if (standing === 'PROBLEM' && borrowerId) {
    return (
      <Link
        href={`/problem-accounts/borrower/${borrowerId}`}
        data-payer-standing={standing}
        aria-label="Problem — open this borrower's Problem Accounts"
        // The ::after widens the tap target to 48px without changing the stamp.
        className={`${base} group relative gap-0.5 transition-colors after:absolute after:-inset-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger`}
      >
        {LABEL[standing]}
        {/* The chevron says "opens more detail"; it nudges right on hover. */}
        <ChevronRight
          aria-hidden="true"
          size={size === 'lg' ? 16 : 13}
          strokeWidth={2.75}
          className="-mr-0.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
        />
      </Link>
    );
  }

  return (
    <span data-payer-standing={standing} className={base}>
      {LABEL[standing]}
    </span>
  );
};

export default PayerBadge;
