import React from 'react';
import { AlertCircle, ArrowRight, BookOpen, Check, CheckCircle, Clock, Lock, Minus } from 'react-feather';
import type { Icon as FeatherIcon } from 'react-feather';

/**
 * The one status badge (Phase 8, 2026-10-08): a word, an icon and a colour, never colour alone
 * (WCAG 1.4.1; Carbon: "at least two of… color, shape, or symbol"). Before it, ~30 hand-written
 * pills used look-alike colours: Closed and For Approval were both orange, Posted and Approved
 * both yellow. Red is reserved for errors and overdue (GOV.UK).
 *
 * Tones, in the order a loan moves through them:
 *   pending  gold      waiting on someone (For Approval)
 *   approved olive tint  a yes was given (Approved)
 *   progress olive ring  next step underway (For Releasing)
 *   success  olive fill  done (Released)
 *   posted   ink fill    in the books (Posted)
 *   closed   grey        finished, nothing left to do (Closed)
 *   danger   red tint    an error or overdue
 *   neutral  plain       anything else
 * Contrast: every text/ground pair is at least 4.5:1 in both themes.
 */
export type StatusTone = 'pending' | 'approved' | 'progress' | 'success' | 'posted' | 'closed' | 'danger' | 'neutral';

const TONES: Record<StatusTone, { cls: string; Icon: FeatherIcon }> = {
  pending: { cls: 'bg-[#F7E7BF] text-[#5C4410] dark:bg-[#3B3020] dark:text-[#E9BE60]', Icon: Clock },
  approved: { cls: 'bg-olive-50 text-olive-800 ring-1 ring-inset ring-olive-200 dark:bg-olive-950 dark:text-olive-200 dark:ring-olive-800', Icon: Check },
  progress: { cls: 'bg-white text-olive-800 ring-1 ring-inset ring-primary dark:bg-transparent dark:text-olive-200 dark:ring-olive-300', Icon: ArrowRight },
  success: { cls: 'bg-primary text-white dark:bg-olive-700', Icon: CheckCircle },
  posted: { cls: 'bg-[#28261A] text-[#F4EFE1] dark:bg-[#F4EFE1] dark:text-[#28261A]', Icon: BookOpen },
  closed: { cls: 'bg-[#E7E2D6] text-[#4F4B3E] dark:bg-meta-4 dark:text-bodydark', Icon: Lock },
  danger: { cls: 'bg-danger/10 text-danger ring-1 ring-inset ring-danger/30 dark:bg-danger/20 dark:text-[#F2988E]', Icon: AlertCircle },
  neutral: { cls: 'bg-whiten text-body ring-1 ring-inset ring-stroke dark:bg-meta-4 dark:text-bodydark dark:ring-strokedark', Icon: Minus },
};

interface StatusBadgeProps {
  tone: StatusTone;
  children: React.ReactNode;
  /** Hide the icon only where space is truly tight; the word always shows. */
  icon?: boolean;
  className?: string;
  title?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ tone, children, icon = true, className = '', title }) => {
  const { cls, Icon } = TONES[tone];
  return (
    <span
      title={title}
      className={`inline-flex h-6 max-w-full items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ${cls} ${className}`}
    >
      {icon && <Icon size={12} strokeWidth={2.5} aria-hidden />}
      <span className="truncate">{children}</span>
    </span>
  );
};

/** A loan's `custom_status`, as the loan lists, SOA and Payment Posting show it. */
export function loanStatusTone(status: string | null | undefined): StatusTone {
  switch (status) {
    case 'For Approval':
      return 'pending';
    case 'Approved':
      return 'approved';
    case 'For Releasing':
      return 'progress';
    case 'Released':
      return 'success';
    case 'Posted':
      return 'posted';
    case 'Closed':
    case 'Posted (Closed)':
      return 'closed';
    default:
      return 'neutral';
  }
}

export const LoanStatusBadge: React.FC<{ status: string | null | undefined }> = ({ status }) =>
  status ? <StatusBadge tone={loanStatusTone(status)}>{status}</StatusBadge> : null;

export default StatusBadge;
