"use client";

import React from "react";

interface BranchBadgeProps {
  /** Parent branch name from DB, e.g. "Marikina FA", "FB", "MB", "One Clark" */
  branchName?: string | null;
  /** Sub-branch display name, e.g. "FB Bataan", "Buendia", "MB 1" */
  subBranchName?: string | null;
  /** 'sm' (default) for table rows, 'lg' for profile pages */
  size?: 'sm' | 'lg';
}

// Only FA/FB/FC/FD get badges — everything else defaults to FA
const BRANCH_STYLES: Record<string, string> = {
  FA: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  FB: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  FC: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  FD: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

/** Returns FA/FB/FC/FD — defaults to FA if branch doesn't explicitly say FB, FC, or FD */
function getCode(branchName: string): 'FA' | 'FB' | 'FC' | 'FD' {
  if (branchName.includes('FB')) return 'FB';
  if (branchName.includes('FC')) return 'FC';
  if (branchName.includes('FD')) return 'FD';
  return 'FA';
}

const BranchBadge: React.FC<BranchBadgeProps> = ({ branchName, subBranchName, size = 'sm' }) => {
  if (!branchName) return null;

  const code = getCode(branchName);
  const styles = BRANCH_STYLES[code];

  // Strip the badge prefix from the sub-branch label to avoid "FB FB Bataan" → "FB Bataan"
  const label = subBranchName?.startsWith(code + ' ')
    ? subBranchName.slice(code.length + 1)
    : subBranchName;

  const isLg = size === 'lg';

  return (
    <div className="flex items-center gap-2" title={subBranchName ?? branchName}>
      <span className={`inline-flex items-center font-bold rounded-full shrink-0 ${styles} ${isLg ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'}`}>
        {code}
      </span>
      {label && (
        <span className={`${isLg ? 'text-sm font-medium text-gray-700 dark:text-gray-300' : 'text-xs text-gray-500 dark:text-gray-400 truncate max-w-[90px]'}`}>
          {label}
        </span>
      )}
    </div>
  );
};

export default BranchBadge;
